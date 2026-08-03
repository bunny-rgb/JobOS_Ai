import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { OAuth2Client } from 'google-auth-library'
import { getDb } from '@/lib/mongodb'
import { hashPassword, verifyPassword, signToken, getUserFromRequest } from '@/lib/auth'
import { llmJson, llmText, MODELS, DEFAULT_MODEL_ID } from '@/lib/llm'
import { SEED_JOBS } from '@/lib/seed'
import { maybeRefreshJobs, refreshJobsCache, USD_TO_INR, currencyForCountry } from '@/lib/jobFetcher'

const googleClient = new OAuth2Client()

function detectCountry(request) {
  return (
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('x-country') ||
    ''
  ).toUpperCase() || null
}

function formatSalary(job, targetCountry) {
  if (!targetCountry || targetCountry === 'US') return job.salary || ''
  const currency = currencyForCountry(targetCountry)
  if (currency === 'INR' && (job.salary_min_usd || job.salary_max_usd)) {
    const min = Math.round((job.salary_min_usd || 0) * USD_TO_INR / 100000)
    const max = Math.round((job.salary_max_usd || 0) * USD_TO_INR / 100000)
    if (job.salary_currency === 'INR') return job.salary
    if (min && max) return `\u20b9${min}L - \u20b9${max}L`
    if (min) return `\u20b9${min}L+`
  }
  return job.salary || ''
}

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

    // ---- Geo detect ----
    if (route === '/geo' && method === 'GET') {
      const country = detectCountry(request) || 'US'
      return ok({ country, currency: currencyForCountry(country) })
    }

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
      if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) return err('Invalid credentials', 401)
      const token = signToken({ uid: user.id, email: user.email })
      const { password_hash, _id, ...safe } = user
      return ok({ token, user: safe })
    }

    // ---- Google OAuth ----
    if (route === '/auth/google' && method === 'POST') {
      const { credential } = await request.json()
      if (!credential || typeof credential !== 'string') return err('Missing Google credential', 400)
      const clientId = process.env.GOOGLE_CLIENT_ID
      if (!clientId) return err('Server missing GOOGLE_CLIENT_ID', 500)
      let payload
      try {
        const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId })
        payload = ticket.getPayload()
      } catch (e) {
        return err('Invalid Google credential', 401)
      }
      if (!payload?.sub || !payload.email) return err('Google account not eligible', 401)
      const googleSub = payload.sub
      const email = payload.email.toLowerCase()
      let user = await db.collection('users').findOne({ google_sub: googleSub })
      if (!user) user = await db.collection('users').findOne({ email })
      if (!user) {
        user = {
          id: uuidv4(),
          email,
          name: payload.name || email.split('@')[0],
          picture: payload.picture || null,
          google_sub: googleSub,
          password_hash: null,
          auth_providers: ['google'],
          skills: [],
          resume_text: '',
          title: '',
          location: '',
          createdAt: new Date(),
        }
        await db.collection('users').insertOne(user)
      } else {
        await db.collection('users').updateOne(
          { id: user.id },
          {
            $set: {
              google_sub: googleSub,
              name: user.name || payload.name || email.split('@')[0],
              picture: payload.picture || user.picture || null,
              updatedAt: new Date(),
            },
            $addToSet: { auth_providers: 'google' },
          }
        )
        user = await db.collection('users').findOne({ id: user.id })
      }
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
      const allowed = ['name', 'title', 'location', 'skills', 'resume_text', 'preferred_model', 'target_role', 'country', 'currency']
      const update = {}
      for (const k of allowed) if (body[k] !== undefined) update[k] = body[k]
      update.updatedAt = new Date()
      await db.collection('users').updateOne({ id: r.user.id }, { $set: update })
      const updated = await db.collection('users').findOne({ id: r.user.id })
      const { password_hash, _id, ...safe } = updated
      return ok({ user: safe })
    }

    if (route === '/profile/resume-upload' && method === 'POST') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const form = await request.formData()
      const file = form.get('file')
      if (!file || typeof file === 'string') return err('No file uploaded', 400)
      const name = file.name || 'resume'
      const size = file.size || 0
      if (size > 8 * 1024 * 1024) return err('File too large (max 8MB)', 413)
      const ext = (name.split('.').pop() || '').toLowerCase()
      const buf = Buffer.from(await file.arrayBuffer())
      let text = ''
      try {
        if (ext === 'pdf') {
          const { extractText, getDocumentProxy } = await import('unpdf')
          const doc = await getDocumentProxy(new Uint8Array(buf))
          const result = await extractText(doc, { mergePages: true })
          text = typeof result?.text === 'string' ? result.text : (Array.isArray(result?.text) ? result.text.join('\n') : '')
        } else if (ext === 'docx') {
          const mammoth = await import('mammoth')
          const result = await mammoth.extractRawText({ buffer: buf })
          text = result.value || ''
        } else if (['txt', 'md'].includes(ext)) {
          text = buf.toString('utf8')
        } else {
          return err(`Unsupported file type .${ext}. Use PDF, DOCX, TXT or MD.`, 400)
        }
      } catch (e) {
        console.error('Resume parse error:', e)
        return err(`Could not parse ${ext.toUpperCase()} file: ${e.message}`, 400)
      }
      text = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 20000)
      await db.collection('users').updateOne(
        { id: r.user.id },
        { $set: { resume_text: text, resume_filename: name, updatedAt: new Date() } }
      )
      const updated = await db.collection('users').findOne({ id: r.user.id })
      const { password_hash, _id, ...safe } = updated
      return ok({ user: safe, chars: text.length, filename: name })
    }

    // ---- Jobs ----
    if (route === '/jobs' && method === 'GET') {
      const url = new URL(request.url)
      const q = (url.searchParams.get('q') || '').toLowerCase()
      const remote = url.searchParams.get('remote')
      const country = (url.searchParams.get('country') || detectCountry(request) || '').toUpperCase()
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
      const limit = Math.min(60, Math.max(6, parseInt(url.searchParams.get('limit') || '24', 10)))
      const refresh = url.searchParams.get('refresh') === 'true'

      if (refresh) await refreshJobsCache(db)
      else maybeRefreshJobs(db).catch(() => {}) // fire and forget

      const filter = {}
      if (remote === 'true') filter.remote = true
      if (q) {
        filter.$or = [
          { title: { $regex: q, $options: 'i' } },
          { company: { $regex: q, $options: 'i' } },
          { skills: { $elemMatch: { $regex: q, $options: 'i' } } },
          { category: { $regex: q, $options: 'i' } },
        ]
      }
      if (country) {
        // Include jobs matching this country, remote jobs, or country-agnostic
        filter.$and = [
          filter.$and || {},
          { $or: [{ country }, { country: null }, { remote: true }] },
        ].filter(x => Object.keys(x).length)
      }

      const total = await db.collection('jobs').countDocuments(filter)
      const docs = await db.collection('jobs')
        .find(filter).sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(limit).toArray()

      const jobs = docs.map(({ _id, ...j }) => ({
        ...j,
        salary_display: formatSalary(j, country),
      }))
      const meta = await db.collection('meta').findOne({ key: 'jobs_last_refresh' })
      return ok({
        jobs,
        page, limit, total,
        hasMore: page * limit < total,
        country,
        currency: currencyForCountry(country),
        lastRefreshed: meta?.at || null,
      })
    }

    if (route === '/jobs/refresh' && method === 'POST') {
      const count = await refreshJobsCache(db)
      return ok({ refreshed: count })
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

    // ---- AI Resume Score for target role ----
    if (route === '/ai/resume-score' && method === 'POST') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const body = await request.json()
      const targetRole = body.target_role || r.user.target_role || r.user.title || 'Software Engineer'
      const modelId = body.modelId || r.user.preferred_model || DEFAULT_MODEL_ID
      const resume = (r.user.resume_text || '').slice(0, 6000)
      if (!resume) return err('No resume on file. Upload your resume first.', 400)

      const prompt = `Act as a senior recruiter and career coach.
Analyze this candidate's resume for the target role: "${targetRole}"

RESUME:
${resume}

CANDIDATE STATED SKILLS: ${(r.user.skills || []).join(', ') || 'not provided'}

Return STRICT JSON only:
{
  "score": <int 0-100 overall fit for this target role>,
  "verdict": "<one of: Excellent | Strong | Solid | Needs Work | Weak>",
  "matched_skills": [<string, skills the resume already demonstrates for this role>],
  "missing_skills": [<string, skills required for the role but missing>],
  "strengths": [<string, 3-4 items specific to this target role>],
  "gaps": [<string, 3-4 items specific to this target role>],
  "keyword_hits": <int, count of role-relevant keywords found>,
  "ats_notes": "<one-line ATS friendliness note>",
  "recommendation": "<one-line concrete next action>",
  "improvements": [<string, 3-5 concrete resume edits to boost score>]
}`
      const analysis = await llmJson({ modelId, prompt })
      const analysisRecord = {
        target_role: targetRole,
        modelId,
        analysis,
        at: new Date(),
      }
      await db.collection('users').updateOne(
        { id: r.user.id },
        { $set: { target_role: targetRole, last_resume_analysis: analysisRecord } }
      )
      const updated = await db.collection('users').findOne({ id: r.user.id })
      const { password_hash, _id, ...safe } = updated
      return ok({ analysis, user: safe })
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
      // avoid duplicates: if exists, optionally advance stage
      const dup = await db.collection('applications').findOne({ userId: r.user.id, jobId: body.jobId })
      if (dup) {
        if (body.stage && body.stage !== dup.stage) {
          await db.collection('applications').updateOne(
            { id: dup.id },
            { $set: { stage: body.stage, updatedAt: new Date() }, $push: { history: { stage: body.stage, at: new Date() } } }
          )
          const upd = await db.collection('applications').findOne({ id: dup.id })
          const { _id: __, ...safe } = upd
          return ok({ application: safe, apply_url: job.apply_url || null, updated: true })
        }
        return err('Already added to tracker', 409)
      }
      const app = {
        id: uuidv4(),
        userId: r.user.id,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        company_logo: job.company_logo,
        location: job.location,
        salary: job.salary,
        apply_url: job.apply_url || null,
        stage: body.stage || 'interested',
        match_percent: body.match_percent || null,
        notes: body.notes || '',
        history: [{ stage: body.stage || 'interested', at: new Date() }],
        createdAt: new Date(),
      }
      await db.collection('applications').insertOne(app)
      const { _id, ...safe } = app
      return ok({ application: safe, apply_url: job.apply_url || null })
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

    // ---- Interview Coach ----
    if (route === '/interview/rounds' && method === 'GET') {
      return ok({
        rounds: [
          { id: 'qa', label: 'QA / Manual Testing', desc: 'Test cases, bug reports, agile/JIRA, regression, exploratory.' },
          { id: 'sql', label: 'SQL', desc: 'Joins, aggregations, window functions, indexing, optimization.' },
          { id: 'hr', label: 'HR', desc: 'Motivation, culture-fit, salary, notice period, background.' },
          { id: 'behavioral', label: 'Behavioral (STAR)', desc: 'Conflict, ownership, failure, teamwork \u2014 answered in STAR.' },
          { id: 'system_design', label: 'System Design', desc: 'Scalability, tradeoffs, capacity, API + DB design.' },
          { id: 'manager', label: 'Manager Round', desc: 'Leadership, prioritization, stakeholder communication.' },
        ],
      })
    }

    if (route === '/interview/start' && method === 'POST') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const { round, modelId, total = 5 } = await request.json()
      const rounds = ['qa', 'sql', 'hr', 'behavioral', 'system_design', 'manager']
      if (!rounds.includes(round)) return err('Invalid round', 400)
      const session = {
        id: uuidv4(),
        userId: r.user.id,
        round,
        modelId: modelId || r.user.preferred_model || DEFAULT_MODEL_ID,
        total: Math.min(Math.max(3, total), 10),
        turns: [], // { question, answer, feedback, score }
        status: 'active',
        createdAt: new Date(),
      }
      // Generate first question
      const prompt = `You are a senior interviewer running a ${round.toUpperCase()} round for candidate "${r.user.name || 'the candidate'}" (title: ${r.user.title || 'not specified'}, skills: ${(r.user.skills || []).join(', ') || 'unknown'}).
Ask ONE clear, medium-difficulty interview question for this round. Return STRICT JSON:
{"question":"<one question, no preamble>","hint":"<one-line hint, optional>","category":"<sub-topic>"}`
      const q = await llmJson({ modelId: session.modelId, prompt })
      session.turns.push({ question: q.question || q._raw || 'Tell me about your experience.', hint: q.hint || '', category: q.category || round })
      await db.collection('interview_sessions').insertOne(session)
      const { _id, ...safe } = session
      return ok({ session: safe, currentQuestion: session.turns[0] })
    }

    if (route === '/interview/answer' && method === 'POST') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const { sessionId, answer } = await request.json()
      const session = await db.collection('interview_sessions').findOne({ id: sessionId, userId: r.user.id })
      if (!session) return err('Session not found', 404)
      if (session.status !== 'active') return err('Session already completed', 400)
      const idx = session.turns.length - 1
      if (!session.turns[idx] || session.turns[idx].answer) return err('No pending question', 400)

      // Evaluate answer
      const evalPrompt = `Evaluate this interview answer. Round: ${session.round.toUpperCase()}.
Question: ${session.turns[idx].question}
Candidate Answer: ${answer}

Return STRICT JSON:
{"score": <int 0-10>, "feedback": "<2-3 sentence constructive feedback>", "ideal_points": [<string, 2-3 bullets of what a great answer covers>]}`
      const evaluation = await llmJson({ modelId: session.modelId, prompt: evalPrompt })

      session.turns[idx].answer = answer
      session.turns[idx].feedback = evaluation.feedback || evaluation._raw || ''
      session.turns[idx].score = typeof evaluation.score === 'number' ? evaluation.score : 5
      session.turns[idx].ideal_points = evaluation.ideal_points || []

      const answeredCount = session.turns.length
      let nextQuestion = null
      let report = null

      if (answeredCount < session.total) {
        const asked = session.turns.map(t => t.question).join(' | ')
        const nextPrompt = `Continue the ${session.round.toUpperCase()} interview. Previously asked: ${asked}
Ask ONE new medium-difficulty question, avoiding overlap. Return STRICT JSON:
{"question":"<one question>","hint":"<optional>","category":"<sub-topic>"}`
        const q = await llmJson({ modelId: session.modelId, prompt: nextPrompt })
        nextQuestion = { question: q.question || q._raw || 'Describe a challenging bug you fixed.', hint: q.hint || '', category: q.category || session.round }
        session.turns.push(nextQuestion)
      } else {
        // Final report
        const transcript = session.turns.map((t, i) => `Q${i+1} (${t.category || ''}): ${t.question}\nA${i+1}: ${t.answer}\nScore: ${t.score}/10\nFeedback: ${t.feedback}`).join('\n\n')
        const reportPrompt = `Provide a final evaluation report for this ${session.round.toUpperCase()} mock interview.
Transcript:
${transcript}

Return STRICT JSON:
{
  "overall_score": <int 0-100>,
  "verdict": "<Excellent | Strong | Solid | Needs Work | Weak>",
  "strengths": [<string, 3-4 items>],
  "weak_areas": [<string, 3-4 items>],
  "recommendations": [<string, 3-4 concrete action items>]
}`
        report = await llmJson({ modelId: session.modelId, prompt: reportPrompt })
        session.status = 'completed'
        session.report = report
        session.completedAt = new Date()
      }

      await db.collection('interview_sessions').updateOne(
        { id: sessionId },
        { $set: { turns: session.turns, status: session.status, report: session.report || null, completedAt: session.completedAt || null } }
      )
      const { _id, ...safe } = session
      return ok({ session: safe, evaluation: session.turns[idx], nextQuestion, report, done: session.status === 'completed', progress: { answered: answeredCount, total: session.total } })
    }

    if (route === '/interview/sessions' && method === 'GET') {
      const r = await requireUser(request, db); if (r.error) return r.error
      const items = await db.collection('interview_sessions')
        .find({ userId: r.user.id })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray()
      return ok({ sessions: items.map(({ _id, ...s }) => s) })
    }

    // Route not found
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
