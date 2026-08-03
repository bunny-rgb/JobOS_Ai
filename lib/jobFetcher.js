import 'server-only'

// Simple in-memory hash for deterministic IDs (avoid uuid churn)
function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0 }
  return Math.abs(h).toString(36)
}

function initials(s) {
  return (s || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function clean(str, max = 1200) {
  return String(str || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

// Infer 2-letter ISO country code from a location string
export function inferCountry(location) {
  const s = String(location || '').toLowerCase()
  if (!s) return null
  if (/worldwide|anywhere|global|any location|remote\s*$/i.test(s)) return null
  const rules = [
    ['IN', /\b(india|bengaluru|bangalore|mumbai|new\s?delhi|\bdelhi\b|hyderabad|pune|chennai|kolkata|noida|gurgaon|gurugram|ahmedabad|jaipur|kochi|indore|surat|nagpur|bhopal)\b/i],
    ['US', /\b(united\s?states|usa|u\.s\.a?|new\s?york|san\s?francisco|los\s?angeles|boston|chicago|seattle|austin|denver|atlanta|dallas|houston|miami|nyc|silicon\s?valley|america|indiana|california|texas|florida|remote\s*\(us\))\b/i],
    ['GB', /\b(united\s?kingdom|uk|england|scotland|wales|london|manchester|edinburgh|birmingham|bristol|glasgow|leeds)\b/i],
    ['CA', /\b(canada|toronto|vancouver|montreal|ottawa|calgary|edmonton)\b/i],
    ['DE', /\b(germany|deutschland|berlin|munich|münchen|hamburg|frankfurt|cologne|köln|stuttgart)\b/i],
    ['FR', /\b(france|paris|lyon|marseille|toulouse|nice|nantes|bordeaux)\b/i],
    ['AU', /\b(australia|sydney|melbourne|brisbane|perth|adelaide|canberra)\b/i],
    ['NZ', /\b(new\s?zealand|auckland|wellington)\b/i],
    ['SG', /\b(singapore)\b/i],
    ['AE', /\b(uae|united\s?arab|dubai|abu\s?dhabi|sharjah)\b/i],
    ['NL', /\b(netherlands|holland|amsterdam|rotterdam|utrecht|the\s?hague)\b/i],
    ['ES', /\b(spain|españa|madrid|barcelona|valencia|seville)\b/i],
    ['IE', /\b(ireland|dublin|cork|galway)\b/i],
    ['IT', /\b(italy|italia|rome|milan|turin|naples)\b/i],
    ['PL', /\b(poland|polska|warsaw|krakow|wroclaw)\b/i],
    ['BR', /\b(brazil|brasil|são\s?paulo|sao\s?paulo|rio\s?de\s?janeiro)\b/i],
    ['MX', /\b(mexico|méxico|cdmx|mexico\s?city|guadalajara)\b/i],
    ['JP', /\b(japan|tokyo|osaka|kyoto)\b/i],
    ['CH', /\b(switzerland|zurich|geneva|basel)\b/i],
    ['SE', /\b(sweden|stockholm|gothenburg|malmö|malmo)\b/i],
    ['NO', /\b(norway|oslo)\b/i],
    ['FI', /\b(finland|helsinki|espoo)\b/i],
    ['DK', /\b(denmark|copenhagen)\b/i],
    ['ZA', /\b(south\s?africa|cape\s?town|johannesburg)\b/i],
    ['MY', /\b(malaysia|kuala\s?lumpur)\b/i],
    ['ID', /\b(indonesia|jakarta|surabaya|bali)\b/i],
    ['PH', /\b(philippines|manila|cebu)\b/i],
    ['VN', /\b(vietnam|hanoi|ho\s?chi\s?minh|saigon)\b/i],
    ['PK', /\b(pakistan|karachi|lahore|islamabad)\b/i],
    ['BD', /\b(bangladesh|dhaka)\b/i],
    ['LK', /\b(sri\s?lanka|colombo)\b/i],
  ]
  for (const [code, rx] of rules) if (rx.test(s)) return code
  return null
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
      id: `remotive-${hash(String(j.id))}`,
      title: j.title,
      company: j.company_name,
      company_logo: initials(j.company_name),
      location: j.candidate_required_location || 'Remote',
      remote: true,
      worldwide: /worldwide|anywhere|any location/i.test(j.candidate_required_location || ''),
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
      country: inferCountry(j.candidate_required_location),
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
      id: `remoteok-${hash(String(j.id || j.slug || j.url))}`,
      title: j.position || j.title,
      company: j.company,
      company_logo: initials(j.company),
      location: j.location || 'Remote',
      remote: true,
      worldwide: /worldwide|anywhere|global/i.test(j.location || ''),
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
      country: inferCountry(j.location),
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
      id: `arbeitnow-${hash(String(j.slug))}`,
      title: j.title,
      company: j.company_name,
      company_logo: initials(j.company_name),
      location: (j.location || 'Remote'),
      remote: !!j.remote,
      worldwide: false,
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
      country: inferCountry(j.location) || 'DE',
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
      id: `jobicy-${hash(String(j.id))}`,
      title: j.jobTitle,
      company: j.companyName,
      company_logo: initials(j.companyName),
      location: (j.jobGeo || 'Remote'),
      remote: true,
      worldwide: /worldwide|anywhere|global/i.test(j.jobGeo || ''),
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
      country: inferCountry(j.jobGeo),
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
