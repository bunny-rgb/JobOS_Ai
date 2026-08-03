import 'server-only'

// Simple in-memory hash for deterministic IDs (avoid uuid churn)
function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0 }
  return `ext_${Math.abs(h).toString(36)}`
}

function initials(s) {
  return (s || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function clean(str, max = 1200) {
  return String(str || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

function normalizeSkills(arr) {
  const KNOWN = ['JavaScript','TypeScript','Python','Java','C++','Go','Ruby','PHP','SQL','NoSQL','MongoDB','PostgreSQL',
    'React','Next.js','Vue','Angular','Svelte','Node.js','Express','Django','Flask','FastAPI','Spring','Rails',
    'AWS','Azure','GCP','Docker','Kubernetes','CI/CD','Terraform','Linux','REST','GraphQL','gRPC',
    'Selenium','Playwright','Cypress','JUnit','TestNG','Postman','JIRA','Agile','Scrum',
    'Manual Testing','API Testing','Regression','Automation','QA','SDET',
    'Product Management','Roadmapping','A/B Testing','Analytics','User Research','Stakeholder Management',
    'Data Engineering','Airflow','Spark','ETL','Snowflake','dbt',
    'Machine Learning','Deep Learning','NLP','TensorFlow','PyTorch','Data Science']
  const bag = Array.isArray(arr) ? arr : String(arr || '').split(/[,\/;|]/)
  const text = bag.join(' ').toLowerCase()
  const found = KNOWN.filter(k => text.includes(k.toLowerCase()))
  return [...new Set(found)].slice(0, 8)
}

async function fetchRemotive() {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=100', { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.jobs || []).map(j => ({
      id: hash(`remotive-${j.id}`),
      title: j.title,
      company: j.company_name,
      company_logo: initials(j.company_name),
      location: j.candidate_required_location || 'Remote',
      remote: true,
      salary: j.salary || '',
      salary_currency: 'USD',
      skills: normalizeSkills([j.category, j.title, j.description]),
      description: clean(j.description, 1500),
      hiring_speed: 'Moderate',
      posted: new Date(j.publication_date).toLocaleDateString(),
      type: j.job_type || 'Full-time',
      apply_url: j.url,
      source: 'remotive',
      category: j.category || 'Software',
      country: null,
      createdAt: new Date(),
    }))
  } catch { return [] }
}

async function fetchRemoteOK() {
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'JobOSAI/1.0 (careers-aggregator)' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data.slice(1, 120) : []).map(j => ({
      id: hash(`remoteok-${j.id || j.slug || j.url}`),
      title: j.position || j.title,
      company: j.company,
      company_logo: initials(j.company),
      location: j.location || 'Remote',
      remote: true,
      salary: (j.salary_min && j.salary_max) ? `$${Math.round(j.salary_min / 1000)}K - $${Math.round(j.salary_max / 1000)}K` : '',
      salary_min_usd: j.salary_min || null,
      salary_max_usd: j.salary_max || null,
      salary_currency: 'USD',
      skills: normalizeSkills([...(j.tags || []), j.position]),
      description: clean(j.description, 1500),
      hiring_speed: 'Fast',
      posted: j.date ? new Date(j.date).toLocaleDateString() : 'Recent',
      type: 'Full-time',
      apply_url: j.apply_url || j.url,
      source: 'remoteok',
      category: (j.tags || [])[0] || 'Software',
      country: null,
      createdAt: new Date(),
    })).filter(j => j.title && j.company && j.apply_url)
  } catch { return [] }
}

async function fetchArbeitnow() {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data || []).slice(0, 100).map(j => ({
      id: hash(`arbeitnow-${j.slug}`),
      title: j.title,
      company: j.company_name,
      company_logo: initials(j.company_name),
      location: (j.location || 'Remote'),
      remote: !!j.remote,
      salary: '',
      salary_currency: 'EUR',
      skills: normalizeSkills([...(j.tags || []), j.title]),
      description: clean(j.description, 1500),
      hiring_speed: 'Moderate',
      posted: j.created_at ? new Date(j.created_at * 1000).toLocaleDateString() : 'Recent',
      type: (j.job_types || [])[0] || 'Full-time',
      apply_url: j.url,
      source: 'arbeitnow',
      category: (j.tags || [])[0] || 'Software',
      country: 'DE',
      createdAt: new Date(),
    }))
  } catch { return [] }
}

async function fetchJobicy() {
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=100', { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.jobs || []).map(j => ({
      id: hash(`jobicy-${j.id}`),
      title: j.jobTitle,
      company: j.companyName,
      company_logo: initials(j.companyName),
      location: (j.jobGeo || 'Remote'),
      remote: true,
      salary: (j.annualSalaryMin && j.annualSalaryMax) ? `${j.salaryCurrency || '$'}${Math.round(j.annualSalaryMin/1000)}K - ${j.salaryCurrency || '$'}${Math.round(j.annualSalaryMax/1000)}K` : '',
      salary_min_usd: j.annualSalaryMin || null,
      salary_max_usd: j.annualSalaryMax || null,
      salary_currency: j.salaryCurrency || 'USD',
      skills: normalizeSkills([j.jobIndustry, j.jobType, j.jobTitle, ...(j.jobLevel || [])].filter(Boolean).flat()),
      description: clean(j.jobDescription, 1500),
      hiring_speed: 'Moderate',
      posted: j.pubDate ? new Date(j.pubDate).toLocaleDateString() : 'Recent',
      type: (j.jobType || ['Full-time'])[0] || 'Full-time',
      apply_url: j.url,
      source: 'jobicy',
      category: j.jobIndustry || 'Software',
      country: null,
      createdAt: new Date(),
    })).filter(j => j.title && j.company && j.apply_url)
  } catch { return [] }
}

export async function fetchAllJobs() {
  const results = await Promise.allSettled([
    fetchRemotive(), fetchRemoteOK(), fetchArbeitnow(), fetchJobicy(),
  ])
  const jobs = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
  // Dedupe by id
  const map = new Map()
  for (const j of jobs) if (!map.has(j.id)) map.set(j.id, j)
  return Array.from(map.values())
}

// TTL for the cache in ms
export const JOBS_CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function refreshJobsCache(db) {
  const jobs = await fetchAllJobs()
  if (!jobs.length) return 0
  const bulk = jobs.map(j => ({
    updateOne: {
      filter: { id: j.id },
      update: { $set: j },
      upsert: true,
    },
  }))
  if (bulk.length) await db.collection('jobs').bulkWrite(bulk, { ordered: false })
  await db.collection('meta').updateOne(
    { key: 'jobs_last_refresh' },
    { $set: { key: 'jobs_last_refresh', at: new Date() } },
    { upsert: true }
  )
  return jobs.length
}

export async function maybeRefreshJobs(db) {
  const meta = await db.collection('meta').findOne({ key: 'jobs_last_refresh' })
  const staleAfter = new Date(Date.now() - JOBS_CACHE_TTL)
  if (!meta || !meta.at || meta.at < staleAfter) {
    return refreshJobsCache(db)
  }
  return 0
}

// Currency conversion helpers
export const USD_TO_INR = 83.5

const COUNTRY_CURRENCY = {
  IN: 'INR', US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR',
  SG: 'SGD', AE: 'AED', JP: 'JPY', BR: 'BRL', MX: 'MXN', PL: 'PLN', SE: 'SEK', CH: 'CHF',
}

export function currencyForCountry(code) {
  return COUNTRY_CURRENCY[String(code || '').toUpperCase()] || 'USD'
}
