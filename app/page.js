'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  Sparkles, Briefcase, LayoutDashboard, Kanban, User, LogOut, Search,
  MapPin, DollarSign, Clock, TrendingUp, Target, Zap, ChevronRight,
  Sun, Moon, Loader2, X, Plus, CheckCircle2, Building2, Award,
  Wand2, ArrowRight, GraduationCap, Rocket, Trophy, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STAGES = [
  { key: 'interested', label: 'Interested', color: 'from-slate-500/20 to-slate-500/5', dot: 'bg-slate-400' },
  { key: 'applied', label: 'Applied', color: 'from-blue-500/20 to-blue-500/5', dot: 'bg-blue-400' },
  { key: 'assessment', label: 'Assessment', color: 'from-purple-500/20 to-purple-500/5', dot: 'bg-purple-400' },
  { key: 'interview', label: 'Interview', color: 'from-amber-500/20 to-amber-500/5', dot: 'bg-amber-400' },
  { key: 'offer', label: 'Offer', color: 'from-green-500/20 to-green-500/5', dot: 'bg-green-400' },
  { key: 'rejected', label: 'Rejected', color: 'from-red-500/20 to-red-500/5', dot: 'bg-red-400' },
]

function api(path, { token, method = 'GET', body } = {}) {
  return fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(data.error || 'Request failed')
    return data
  })
}

// ---------- Landing ----------
function Landing({ onGetStarted }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0 glow" />
      <NavBar onGetStarted={onGetStarted} />
      <section className="relative container mx-auto px-6 pt-24 pb-32 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-primary/90">Powered by GPT-5 &amp; Claude Sonnet 4.5</span>
          </div>
          <h1 className="mt-8 text-5xl md:text-7xl font-semibold tracking-tight">
            Your AI Career <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Copilot</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            JobOS AI runs your entire job search &mdash; discover jobs, match instantly with AI, track applications, and land offers 10x faster.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="h-12 px-6 text-base" onClick={onGetStarted}>
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-6 text-base" onClick={onGetStarted}>
              See Demo
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 grid gap-4 md:grid-cols-3"
        >
          {[
            { icon: Target, title: 'AI Job Match', desc: 'Every job scored 0-100% against your skills with actionable gaps.' },
            { icon: Kanban, title: 'Kanban Tracker', desc: 'Interested \u2192 Applied \u2192 Interview \u2192 Offer. All in one board.' },
            { icon: Wand2, title: 'AI Cover Letters', desc: 'Tailored letters generated in seconds for every role.' },
          ].map((f, i) => (
            <Card key={i} className="card-glow border-white/5">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="mt-3 text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </section>
    </div>
  )
}

function NavBar({ user, onGetStarted, onLogout, onNav, current }) {
  const { theme, setTheme } = useTheme()
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 max-w-7xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">J</div>
            <span className="font-semibold tracking-tight">JobOS AI</span>
          </div>
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { key: 'jobs', label: 'Jobs', icon: Briefcase },
                { key: 'tracker', label: 'Tracker', icon: Kanban },
                { key: 'profile', label: 'Profile', icon: User },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => onNav(item.key)}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
                    current === item.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-sm">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-muted-foreground">{user.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onLogout}><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <Button onClick={onGetStarted}>Get Started</Button>
          )}
        </div>
      </div>
    </header>
  )
}

// ---------- Auth ----------
function AuthDialog({ open, onOpenChange, onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await api(`/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST', body: { email, password, name },
      })
      localStorage.setItem('jobos_token', data.token)
      localStorage.setItem('jobos_user', JSON.stringify(data.user))
      onAuth(data.token, data.user)
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created! Welcome to JobOS AI.')
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-white/10 card-glow">
        <DialogHeader>
          <DialogTitle className="text-2xl">{mode === 'login' ? 'Welcome back' : 'Create your account'}</DialogTitle>
          <DialogDescription>Your AI career copilot is one click away.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
          )}
          <Input placeholder="you@work.com" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
          <Input placeholder="Password (min 6 chars)" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
          <button
            type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Dashboard ----------
function Dashboard({ token, user, onNav }) {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    api('/dashboard/stats', { token }).then(setStats).catch(() => {})
  }, [token])

  const cards = [
    { label: 'Applications', value: stats?.stats?.total ?? 0, icon: Briefcase, color: 'text-blue-400' },
    { label: 'Interviews', value: stats?.stats?.interview ?? 0, icon: Target, color: 'text-amber-400' },
    { label: 'Offers', value: stats?.stats?.offer ?? 0, icon: Trophy, color: 'text-green-400' },
    { label: 'Resume Score', value: `${stats?.resume_score ?? 0}%`, icon: FileText, color: 'text-primary' },
  ]
  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {user.name} <span className="opacity-60">👋</span></h1>
          <p className="text-muted-foreground mt-1">Here&apos;s your career mission control.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onNav('jobs')}><Sparkles className="mr-2 h-4 w-4" /> Discover Jobs</Button>
          <Button variant="outline" onClick={() => onNav('tracker')}><Kanban className="mr-2 h-4 w-4" /> Open Tracker</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mt-8">
        {cards.map((c, i) => (
          <Card key={i} className="card-glow border-white/5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{c.value}</p>
                </div>
                <div className={`h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center ${c.color}`}>
                  <c.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <Card className="card-glow border-white/5 md:col-span-2">
          <CardHeader><CardTitle className="text-base">Pipeline Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {STAGES.map(s => {
                const val = stats?.stats?.[s.key] ?? 0
                const max = Math.max(1, ...STAGES.map(x => stats?.stats?.[x.key] ?? 0))
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}</span>
                      <span className="text-muted-foreground">{val}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${s.color.replace('/20','/60').replace('/5','/30')}`} style={{ width: `${(val / max) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="card-glow border-white/5">
          <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => onNav('jobs')}>
              <Search className="mr-2 h-4 w-4" /> Find matching jobs
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => onNav('profile')}>
              <User className="mr-2 h-4 w-4" /> Update your skills
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => onNav('tracker')}>
              <Kanban className="mr-2 h-4 w-4" /> Manage applications
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---------- Jobs ----------
function Jobs({ token, user, onOpenMatch, onRefreshApps }) {
  const [jobs, setJobs] = useState([])
  const [q, setQ] = useState('')
  const [remote, setRemote] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (remote) params.set('remote', 'true')
    api(`/jobs?${params}`, { token }).then(d => setJobs(d.jobs)).finally(() => setLoading(false))
  }
  useEffect(load, [q, remote])

  const addToTracker = async (job) => {
    try {
      await api('/applications', { token, method: 'POST', body: { jobId: job.id, stage: 'interested' } })
      toast.success(`Added ${job.title} to tracker`)
      onRefreshApps?.()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Discover Jobs</h1>
          <p className="text-muted-foreground mt-1">AI-ranked opportunities matched to your profile.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search title, company or skill..." value={q} onChange={e => setQ(e.target.value)} className="pl-10 h-11" />
        </div>
        <Button variant={remote ? 'default' : 'outline'} onClick={() => setRemote(v => !v)} className="h-11">
          <MapPin className="mr-2 h-4 w-4" /> Remote only
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map(job => (
            <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="card-glow border-white/5 hover:border-primary/30 transition group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {job.company_logo}
                      </div>
                      <div>
                        <h3 className="font-medium leading-tight">{job.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" /> {job.company}
                        </p>
                      </div>
                    </div>
                    {job.remote && <Badge variant="outline" className="border-green-500/30 text-green-400">Remote</Badge>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                    {job.salary && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {job.salary}</span>}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {job.posted}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(job.skills || []).slice(0, 4).map(s => (
                      <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
                    ))}
                    {(job.skills || []).length > 4 && (
                      <Badge variant="secondary" className="text-xs font-normal">+{job.skills.length - 4}</Badge>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => onOpenMatch(job)}>
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI Match
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addToTracker(job)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- AI Match Dialog ----------
function MatchDialog({ open, job, token, user, onClose, onAddedToTracker }) {
  const [provider, setProvider] = useState(user?.preferred_model || 'openai')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [clLoading, setClLoading] = useState(false)

  useEffect(() => { if (open) { setResult(null); setCoverLetter('') } }, [open, job])

  const runMatch = async () => {
    setLoading(true); setResult(null)
    try {
      const d = await api('/ai/match', { token, method: 'POST', body: { jobId: job.id, provider } })
      setResult(d.match)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  const genCover = async () => {
    setClLoading(true)
    try {
      const d = await api('/ai/cover-letter', { token, method: 'POST', body: { jobId: job.id, provider } })
      setCoverLetter(d.cover_letter)
    } catch (e) { toast.error(e.message) }
    finally { setClLoading(false) }
  }
  const addToTracker = async () => {
    try {
      await api('/applications', {
        token, method: 'POST',
        body: { jobId: job.id, stage: 'interested', match_percent: result?.match_percent }
      })
      toast.success('Added to tracker')
      onAddedToTracker?.()
      onClose()
    } catch (e) { toast.error(e.message) }
  }

  if (!job) return null
  const pct = result?.match_percent ?? 0
  const color = pct >= 75 ? 'text-green-400' : pct >= 55 ? 'text-amber-400' : 'text-red-400'
  const ring = pct >= 75 ? 'stroke-green-400' : pct >= 55 ? 'stroke-amber-400' : 'stroke-red-400'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl border-white/10 card-glow max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
              {job.company_logo}
            </div>
            <div>
              <DialogTitle>{job.title}</DialogTitle>
              <DialogDescription>{job.company} · {job.location}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-3 border border-white/10 rounded-lg p-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm">AI Model:</span>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">GPT-5 (OpenAI)</SelectItem>
              <SelectItem value="anthropic">Claude Sonnet 4.5</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          {!result && (
            <Button size="sm" onClick={runMatch} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Analyzing...</> : <><Zap className="mr-1.5 h-3.5 w-3.5" /> Run Match</>}
            </Button>
          )}
        </div>

        {!result && !loading && (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-lg">
            <Target className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">Click <b>Run Match</b> to see how well you fit this role.</p>
            <p className="text-xs text-muted-foreground mt-1">Tip: add skills &amp; resume text in Profile for better results.</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-10">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Analyzing with {provider === 'openai' ? 'GPT-5' : 'Claude Sonnet 4.5'}...</p>
          </div>
        )}

        {result && (
          <div className="space-y-5">
            <div className="flex items-center gap-5 rounded-xl border border-white/10 p-5 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="relative h-24 w-24 shrink-0">
                <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
                  <circle cx="50" cy="50" r="42" strokeWidth="8" className="stroke-white/10 fill-none" />
                  <circle cx="50" cy="50" r="42" strokeWidth="8" strokeLinecap="round"
                    className={`fill-none ${ring} transition-all`}
                    strokeDasharray={`${(pct/100)*264} 264`} />
                </svg>
                <div className={`absolute inset-0 flex items-center justify-center text-2xl font-semibold ${color}`}>{pct}%</div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Verdict</p>
                <p className={`text-lg font-semibold ${color}`}>{result.verdict || 'Match'}</p>
                <p className="text-sm text-muted-foreground mt-1">{result.recommendation}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">✅ Matched Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {(result.matched_skills || []).map(s => (
                    <Badge key={s} className="bg-green-500/15 text-green-400 border-green-500/30 font-normal">{s}</Badge>
                  ))}
                  {!(result.matched_skills || []).length && <p className="text-xs text-muted-foreground">None detected</p>}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">⚠️ Missing Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {(result.missing_skills || []).map(s => (
                    <Badge key={s} className="bg-amber-500/15 text-amber-400 border-amber-500/30 font-normal">{s}</Badge>
                  ))}
                  {!(result.missing_skills || []).length && <p className="text-xs text-muted-foreground">Nothing critical</p>}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Strengths</p>
                <ul className="space-y-1 text-sm">
                  {(result.strengths || []).map((s, i) => (
                    <li key={i} className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-400 shrink-0" /><span>{s}</span></li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-white/10 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Gaps to Close</p>
                <ul className="space-y-1 text-sm">
                  {(result.gaps || []).map((s, i) => (
                    <li key={i} className="flex gap-2"><TrendingUp className="h-3.5 w-3.5 mt-0.5 text-amber-400 shrink-0" /><span>{s}</span></li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">AI Cover Letter</p>
                <Button size="sm" variant="outline" onClick={genCover} disabled={clLoading}>
                  {clLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Wand2 className="mr-1.5 h-3.5 w-3.5" /> Generate</>}
                </Button>
              </div>
              {coverLetter && (
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap mt-3 max-h-56 overflow-y-auto">{coverLetter}</pre>
              )}
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={addToTracker}><Plus className="mr-1.5 h-4 w-4" /> Add to Tracker</Button>
              <Button variant="outline" onClick={runMatch}>Re-run</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------- Kanban Tracker ----------
function Tracker({ token, refreshKey }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState(null)

  const load = () => {
    setLoading(true)
    api('/applications', { token }).then(d => setApps(d.applications)).finally(() => setLoading(false))
  }
  useEffect(load, [refreshKey])

  const moveTo = async (app, stage) => {
    if (app.stage === stage) return
    setApps(prev => prev.map(a => a.id === app.id ? { ...a, stage } : a))
    try {
      await api(`/applications/${app.id}`, { token, method: 'PATCH', body: { stage } })
      toast.success(`Moved to ${STAGES.find(s => s.key === stage)?.label}`)
    } catch (e) { toast.error(e.message); load() }
  }

  const remove = async (app) => {
    try {
      await api(`/applications/${app.id}`, { token, method: 'DELETE' })
      setApps(prev => prev.filter(a => a.id !== app.id))
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-[1600px]">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Application Tracker</h1>
        <p className="text-muted-foreground mt-1">Drag cards between columns to update stage.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : apps.length === 0 ? (
        <Card className="card-glow border-white/5 border-dashed">
          <CardContent className="py-16 text-center">
            <Kanban className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="mt-3 text-muted-foreground">No applications yet. Head to <b>Jobs</b> and add some!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(6, minmax(260px, 1fr))' }}>
          {STAGES.map(stage => {
            const items = apps.filter(a => a.stage === stage.key)
            return (
              <div
                key={stage.key}
                onDragOver={(e) => { e.preventDefault(); setDragOver(stage.key) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData('text/plain')
                  const app = apps.find(a => a.id === id)
                  if (app) moveTo(app, stage.key)
                  setDragOver(null)
                }}
                className={`rounded-xl border p-3 min-h-[400px] transition ${
                  dragOver === stage.key ? 'border-primary/50 bg-primary/5' : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${stage.dot}`} />
                    <span className="text-sm font-medium">{stage.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map(app => (
                    <motion.div
                      key={app.id}
                      layout
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', app.id)}
                      className="group rounded-lg border border-white/10 bg-card p-3 cursor-grab active:cursor-grabbing hover:border-primary/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded bg-primary/15 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                            {app.company_logo}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{app.jobTitle}</p>
                            <p className="text-xs text-muted-foreground truncate">{app.company}</p>
                          </div>
                        </div>
                        <button onClick={() => remove(app)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {app.match_percent != null && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span className={app.match_percent >= 75 ? 'text-green-400' : app.match_percent >= 55 ? 'text-amber-400' : 'text-muted-foreground'}>
                            {app.match_percent}% match
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------- Profile ----------
function Profile({ token, user, setUser }) {
  const [name, setName] = useState(user.name || '')
  const [title, setTitle] = useState(user.title || '')
  const [location, setLocation] = useState(user.location || '')
  const [skills, setSkills] = useState((user.skills || []).join(', '))
  const [resumeText, setResumeText] = useState(user.resume_text || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const d = await api('/profile', {
        token, method: 'PATCH',
        body: {
          name, title, location,
          skills: skills.split(',').map(s => s.trim()).filter(Boolean),
          resume_text: resumeText,
        },
      })
      setUser(d.user)
      localStorage.setItem('jobos_user', JSON.stringify(d.user))
      toast.success('Profile saved. AI Match will use this.')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setResumeText(text.slice(0, 20000))
    toast.success('Resume loaded. Click Save to persist.')
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight">Your Profile</h1>
      <p className="text-muted-foreground mt-1">Better data = better AI matches. Fill this in for higher accuracy.</p>

      <Card className="card-glow border-white/5 mt-8">
        <CardContent className="p-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">Full name</label>
              <Input value={name} onChange={e => setName(e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Current title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. QA Engineer" className="mt-1.5 h-11" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Location</label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bengaluru, India" className="mt-1.5 h-11" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Preferred AI Model</label>
              <Select value={user.preferred_model || 'openai'} onValueChange={async (v) => {
                const d = await api('/profile', { token, method: 'PATCH', body: { preferred_model: v } })
                setUser(d.user); localStorage.setItem('jobos_user', JSON.stringify(d.user))
              }}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">GPT-5 (OpenAI)</SelectItem>
                  <SelectItem value="anthropic">Claude Sonnet 4.5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Skills (comma-separated)</label>
            <Input value={skills} onChange={e => setSkills(e.target.value)}
              placeholder="e.g. Playwright, TypeScript, SQL, Selenium, API Testing" className="mt-1.5 h-11" />
            <p className="text-xs text-muted-foreground mt-1">Used by AI Match to score every job.</p>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Resume / Bio</label>
            <Textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your resume content or a rich bio here..."
              className="mt-1.5 min-h-[180px]" />
            <div className="mt-2 flex items-center gap-2">
              <input type="file" accept=".txt,.md" onChange={handleFile} className="hidden" id="resume-file" />
              <label htmlFor="resume-file" className="text-xs cursor-pointer inline-flex items-center gap-1.5 text-primary hover:underline">
                <FileText className="h-3 w-3" /> Import .txt / .md
              </label>
              <span className="text-xs text-muted-foreground">{resumeText.length} chars</span>
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- App shell ----------
function App() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [nav, setNav] = useState('dashboard')
  const [matchJob, setMatchJob] = useState(null)
  const [appsKey, setAppsKey] = useState(0)

  useEffect(() => {
    const t = localStorage.getItem('jobos_token')
    const u = localStorage.getItem('jobos_user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
  }, [])

  const logout = () => {
    localStorage.removeItem('jobos_token'); localStorage.removeItem('jobos_user')
    setToken(null); setUser(null); setNav('dashboard')
    toast.success('Signed out')
  }

  if (!token || !user) {
    return (
      <>
        <Landing onGetStarted={() => setAuthOpen(true)} />
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} onAuth={(t, u) => { setToken(t); setUser(u); setAuthOpen(false) }} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar user={user} onLogout={logout} onNav={setNav} current={nav} />
      <AnimatePresence mode="wait">
        <motion.div key={nav} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {nav === 'dashboard' && <Dashboard token={token} user={user} onNav={setNav} />}
          {nav === 'jobs' && <Jobs token={token} user={user} onOpenMatch={setMatchJob} onRefreshApps={() => setAppsKey(k => k + 1)} />}
          {nav === 'tracker' && <Tracker token={token} refreshKey={appsKey} />}
          {nav === 'profile' && <Profile token={token} user={user} setUser={setUser} />}
        </motion.div>
      </AnimatePresence>
      <MatchDialog
        open={!!matchJob} job={matchJob} token={token} user={user}
        onClose={() => setMatchJob(null)}
        onAddedToTracker={() => setAppsKey(k => k + 1)}
      />
    </div>
  )
}

export default App
