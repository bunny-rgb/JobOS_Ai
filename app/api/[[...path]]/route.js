import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongodb'
import { hashPassword, verifyPassword, signToken, getUserFromRequest } from '@/lib/auth'
import { llmJson, llmText, MODELS, DEFAULT_MODEL_ID } from '@/lib/llm'
import { SEED_JOBS } from '@/lib/seed'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return res
}
function ok(data, status = 200) { return cors(NextResponse.json(data, { status })) }
function err(message, status = 400) { return cors(NextResponse.json({ error: message }, { status })) }

export async function OPTIONS() { return cors(new NextResponse(null, { status: 200 })) }

async function ensureSeed(db) {
  const count = await db.collection('jobs').countDocuments()
  if (count === 0) {
    const now = new Date()
    const docs = SEED_JOBS.map(j => ({ id: uuidv4(), ...j, createdAt: now, seed: true }))
    await db.collection('jobs').insertMany(docs)
  }
}

async function requireUser(request, db) {
  const claims = getUserFromRequest(request)
  if (!claims?.uid) return { error: err('Unauthorized', 401) }
  const user = await db.collection('users').findOne({ id: claims.uid })
  if (!user) return { error: err('User not found', 401) }
  return { user }
}

async function handle(request, { params }) {
  const { path = [] } = await params
  const route = '/' + path.join('/')
  const method = request.method
  try {
    const db = await getDb()
    await ensureSeed(db)

    // ---- Health ----
    if (route === '/' && method === 'GET') return ok({ message: 'JobOS AI API' })

    // ---- Models ----
    if (route === '/models' && method === 'GET') {
      return ok({ models: MODELS.map(({ id, label, provider }) => ({ id, label, provider })), default: DEFAULT_MODEL_ID })
    }

    // ---- Auth ----
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const { email, password, name } = body || {}
      if (!email || !password) return err('email and password required')
      const existing = await db.collection('users').findOne({ email: email.toLowerCase() })
      if (existing) return err('User already exists', 409)
      const user = {
        id: uuidv4(),
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        password_hash: hashPassword(password),
        skills: [],
        resume_text: '',
        title: '',
        location: '',
        createdAt: new Date(),
      }
      await db.collection('users').insertOne(user)
      const token = signToken({ uid: user.id, email: user.email })
      const { password_hash, _id, ...safe } = user
      return ok({ token, user: safe })
    }

    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json()
      if (!email || !password) return err('email and password required')
      const user = await db.collection('users').findOne({ email: email.toLowerCase() })
      if (!user || !verifyPassword(password, user.password_hash)) return err('Invalid credentials', 401)
      const token = signToken({ uid: user.id, email: user.email })
      const { password_hash, _id, ...safe } = user
      return ok({ token, user: safe })
    }

    if (route === '/auth/me' && method === 'GET') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const { password_hash, _id, ...safe } = r.user
      return ok({ user: safe })
    }

    // ---- Profile ----
    if (route === '/profile' && method === 'PATCH') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const body = await request.json()
      const allowed = ['name', 'title', 'location', 'skills', 'resume_text', 'preferred_model']
      const update = {}
      for (const k of allowed) if (body[k] !== undefined) update[k] = body[k]
      update.updatedAt = new Date()
      await db.collection('users').updateOne({ id: r.user.id }, { $set: update })
      const updated = await db.collection('users').findOne({ id: r.user.id })
      const { password_hash, _id, ...safe } = updated
      return ok({ user: safe })
    }

    // ---- Jobs ----
    if (route === '/jobs' && method === 'GET') {
      const url = new URL(request.url)
      const q = (url.searchParams.get('q') || '').toLowerCase()
      const remote = url.searchParams.get('remote')
      const docs = await db.collection('jobs').find({}).sort({ createdAt: -1 }).limit(200).toArray()
      let jobs = docs.map(({ _id, ...j }) => j)
      if (q) jobs = jobs.filter(j =>
        (j.title || '').toLowerCase().includes(q) ||
        (j.company || '').toLowerCase().includes(q) ||
        (j.skills || []).some(s => s.toLowerCase().includes(q))
      )
      if (remote === 'true') jobs = jobs.filter(j => j.remote)
      return ok({ jobs })
    }

    if (route === '/jobs' && method === 'POST') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const body = await request.json()
      const job = {
        id: uuidv4(),
        title: body.title || 'Custom Job',
        company: body.company || 'Custom Company',
        location: body.location || 'Remote',
        remote: !!body.remote,
        salary: body.salary || '',
        skills: body.skills || [],
        description: body.description || '',
        hiring_speed: body.hiring_speed || 'Moderate',
        company_logo: (body.company || 'CU').slice(0, 2).toUpperCase(),
        posted: 'Just now',
        type: body.type || 'Full-time',
        createdBy: r.user.id,
        createdAt: new Date(),
      }
      await db.collection('jobs').insertOne(job)
      const { _id, ...safe } = job
      return ok({ job: safe })
    }

    if (route.startsWith('/jobs/') && method === 'GET') {
      const id = route.split('/')[2]
      const job = await db.collection('jobs').findOne({ id })
      if (!job) return err('Not found', 404)
      const { _id, ...safe } = job
      return ok({ job: safe })
    }

    // ---- AI Match ----
    if (route === '/ai/match' && method === 'POST') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const body = await request.json()
      const { jobId, modelId } = body
      const job = await db.collection('jobs').findOne({ id: jobId })
      if (!job) return err('Job not found', 404)
      const userSkills = (r.user.skills || []).join(', ') || 'not provided'
      const resume = (r.user.resume_text || '').slice(0, 6000) || 'not provided'
      const prompt = `Analyze how well this candidate matches this job. Return STRICT JSON only.

JOB TITLE: ${job.title}
COMPANY: ${job.company}
REQUIRED SKILLS: ${(job.skills || []).join(', ')}
DESCRIPTION: ${job.description}

CANDIDATE SKILLS: ${userSkills}
CANDIDATE RESUME/BIO: ${resume}

Return JSON with this exact shape:
{
  "match_percent": <integer 0-100>,
  "matched_skills": [<string>],
  "missing_skills": [<string>],
  "strengths": [<string, 2-4 items>],
  "gaps": [<string, 2-4 items>],
  "recommendation": "<one-line actionable recommendation>",
  "verdict": "<one of: Strong Match | Good Match | Fair Match | Weak Match>"
}`
      const result = await llmJson({
        modelId: modelId || r.user.preferred_model || DEFAULT_MODEL_ID,
        prompt,
      })
      // persist
      await db.collection('ai_matches').insertOne({
        id: uuidv4(), userId: r.user.id, jobId, modelId: modelId || DEFAULT_MODEL_ID, result, createdAt: new Date(),
      })
      return ok({ match: result, job: (({ _id, ...j }) => j)(job) })
    }

    // ---- AI Cover Letter ----
    if (route === '/ai/cover-letter' && method === 'POST') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const { jobId, modelId } = await request.json()
      const job = await db.collection('jobs').findOne({ id: jobId })
      if (!job) return err('Job not found', 404)
      const prompt = `Write a concise, compelling cover letter (max 220 words) for:
Job: ${job.title} at ${job.company}
Required Skills: ${(job.skills || []).join(', ')}
Description: ${job.description}

Candidate: ${r.user.name}
Candidate Skills: ${(r.user.skills || []).join(', ')}
Candidate Resume/Bio: ${(r.user.resume_text || '').slice(0, 3000)}

Return plain text cover letter only, no preamble.`
      const text = await llmText({
        modelId: modelId || r.user.preferred_model || DEFAULT_MODEL_ID,
        prompt,
      })
      return ok({ cover_letter: text })
    }

    // ---- Applications (Kanban) ----
    if (route === '/applications' && method === 'GET') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const apps = await db.collection('applications').find({ userId: r.user.id }).sort({ createdAt: -1 }).toArray()
      return ok({ applications: apps.map(({ _id, ...a }) => a) })
    }

    if (route === '/applications' && method === 'POST') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const body = await request.json()
      const job = await db.collection('jobs').findOne({ id: body.jobId })
      if (!job) return err('Job not found', 404)
      // avoid duplicates
      const dup = await db.collection('applications').findOne({ userId: r.user.id, jobId: body.jobId })
      if (dup) return err('Already added to tracker', 409)
      const app = {
        id: uuidv4(),
        userId: r.user.id,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        company_logo: job.company_logo,
        location: job.location,
        salary: job.salary,
        stage: body.stage || 'interested',
        match_percent: body.match_percent || null,
        notes: body.notes || '',
        history: [{ stage: body.stage || 'interested', at: new Date() }],
        createdAt: new Date(),
      }
      await db.collection('applications').insertOne(app)
      const { _id, ...safe } = app
      return ok({ application: safe })
    }

    if (route.startsWith('/applications/') && method === 'PATCH') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const id = route.split('/')[2]
      const body = await request.json()
      const app = await db.collection('applications').findOne({ id, userId: r.user.id })
      if (!app) return err('Not found', 404)
      const update = { updatedAt: new Date() }
      if (body.stage) update.stage = body.stage
      if (body.notes !== undefined) update.notes = body.notes
      const push = body.stage && body.stage !== app.stage
        ? { history: { stage: body.stage, at: new Date() } } : null
      const op = { $set: update }
      if (push) op.$push = push
      await db.collection('applications').updateOne({ id }, op)
      const updated = await db.collection('applications').findOne({ id })
      const { _id, ...safe } = updated
      return ok({ application: safe })
    }

    if (route.startsWith('/applications/') && method === 'DELETE') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const id = route.split('/')[2]
      await db.collection('applications').deleteOne({ id, userId: r.user.id })
      return ok({ deleted: true })
    }

    // ---- Dashboard ----
    if (route === '/dashboard/stats' && method === 'GET') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const apps = await db.collection('applications').find({ userId: r.user.id }).toArray()
      const stats = {
        total: apps.length,
        interested: apps.filter(a => a.stage === 'interested').length,
        applied: apps.filter(a => a.stage === 'applied').length,
        assessment: apps.filter(a => a.stage === 'assessment').length,
        interview: apps.filter(a => a.stage === 'interview').length,
        offer: apps.filter(a => a.stage === 'offer').length,
        rejected: apps.filter(a => a.stage === 'rejected').length,
      }
      // resume score = heuristic based on profile completeness
      const u = r.user
      let score = 20
      if (u.name) score += 10
      if (u.title) score += 10
      if (u.location) score += 10
      if ((u.skills || []).length >= 3) score += 20
      if ((u.skills || []).length >= 8) score += 10
      if ((u.resume_text || '').length > 300) score += 20
      score = Math.min(score, 100)
      return ok({ stats, resume_score: score })
    }

    return err(`Route ${route} not found`, 404)
  } catch (e) {
    console.error('API Error:', e)
    return err(e?.message || 'Internal server error', 500)
  }
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
