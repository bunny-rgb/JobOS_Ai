'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  Sparkles, Briefcase, LayoutDashboard, Kanban, User, LogOut, Search,
  MapPin, DollarSign, Clock, TrendingUp, Target, Zap, ChevronRight,
  Sun, Moon, Loader2, X, Plus, CheckCircle2, Building2, Award,
  Wand2, ArrowRight, GraduationCap, Rocket, Trophy, FileText, Upload, FileUp, Home
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 hero-glow" />
      <NavBar onGetStarted={onGetStarted} />
      <section className="relative container mx-auto px-6 pt-24 pb-32 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/5 px-4 py-1.5 text-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-muted-foreground">Powered by Gemini 2.5 &amp; Claude Sonnet 4.5</span>
          </div>
          <h1 className="mt-8 text-5xl md:text-7xl font-semibold tracking-tight">
            Your AI Career <span className="bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent">Copilot</span>
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
            { icon: Kanban, title: 'Kanban Tracker', desc: 'Interested → Applied → Interview → Offer. All in one board.' },
            { icon: Wand2, title: 'AI Cover Letters', desc: 'Tailored letters generated in seconds for every role.' },
          ].map((f, i) => (
            <Card key={i} className="card-glow">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5">
                  <f.icon className="h-5 w-5" />
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
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const activeTheme = mounted ? (resolvedTheme || theme) : 'dark'
  const goHome = () => onNav && onNav('dashboard')
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 max-w-7xl">
        <div className="flex items-center gap-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={user ? goHome : undefined}
                className={`flex items-center gap-2 ${user ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-white to-neutral-400 text-black font-semibold shadow-lg shadow-black/30">
                  J
                </div>
                <span className="font-semibold tracking-tight">JobOS AI</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{user ? 'Go to Dashboard' : 'JobOS AI — home'}</TooltipContent>
          </Tooltip>

          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tip: 'Your career mission control' },
                { key: 'jobs', label: 'Jobs', icon: Briefcase, tip: 'Discover matching roles' },
                { key: 'tracker', label: 'Tracker', icon: Kanban, tip: 'Kanban application tracker' },
                { key: 'interview', label: 'Interview', icon: GraduationCap, tip: 'AI mock interviews' },
                { key: 'profile', label: 'Profile', icon: User, tip: 'Skills, resume & preferences' },
              ].map(item => (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onNav(item.key)}
                      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
                        current === item.key
                          ? 'bg-foreground/10 text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                      }`}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{item.tip}</TooltipContent>
                </Tooltip>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
                <span suppressHydrationWarning>
                  {mounted ? (activeTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Sun className="h-4 w-4 opacity-0" />}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{mounted && activeTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</TooltipContent>
          </Tooltip>
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm">
                <div className="h-6 w-6 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-medium">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-muted-foreground">{user.name}</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onLogout}><LogOut className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <Button onClick={onGetStarted}>Get Started</Button>
          )}
        </div>
      </div>
    </header>
  )
}

// ---------- Reusable Resume Upload ----------
function ResumeUploader({ token, user, setUser, compact = false }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const doUpload = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx', 'txt', 'md'].includes(ext)) {
      toast.error('Only PDF, DOCX, TXT, or MD files are supported')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('File too large (max 8MB)')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/profile/resume-upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setUser(data.user)
      localStorage.setItem('jobos_user', JSON.stringify(data.user))
      toast.success(`Resume parsed — ${data.chars.toLocaleString()} characters extracted`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setUploading(false)
    }
  }

  const currentName = user?.resume_filename
  const currentChars = user?.resume_text?.length || 0

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragOver(false)
        doUpload(e.dataTransfer.files?.[0])
      }}
      className={`rounded-xl border-2 border-dashed transition ${
        dragOver ? 'border-foreground/60 bg-foreground/5' : 'border-border bg-background/30'
      } ${compact ? 'p-4' : 'p-6'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
        className="hidden"
        onChange={(e) => doUpload(e.target.files?.[0])}
      />
      <div className={`flex ${compact ? 'items-center gap-4' : 'flex-col items-center text-center gap-3'}`}>
        <div className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-lg bg-foreground/5 flex items-center justify-center shrink-0`}>
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileUp className="h-5 w-5" />}
        </div>
        <div className={compact ? 'flex-1 min-w-0' : ''}>
          <p className="text-sm font-medium">
            {currentName ? (
              <>Resume: <span className="text-muted-foreground truncate">{currentName}</span></>
            ) : uploading ? 'Parsing your resume...' : 'Upload your resume'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentChars > 0 && !uploading
              ? `${currentChars.toLocaleString()} chars parsed · `
              : ''}
            Drag &amp; drop or click — PDF, DOCX, TXT, MD (max 8MB)
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={compact ? 'sm' : 'default'}
              variant={currentName ? 'outline' : 'default'}
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {currentName ? 'Replace' : 'Choose file'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{currentName ? 'Upload a new resume file' : 'Pick a PDF, DOCX, TXT or MD file'}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

// ---------- Auth ----------
function AuthDialog({ open, onOpenChange, onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const btnRef = useRef(null)
  const [gsiReady, setGsiReady] = useState(false)

  const handleGoogleCredential = async (response) => {
    try {
      const data = await api('/auth/google', {
        method: 'POST', body: { credential: response.credential }
      })
      localStorage.setItem('jobos_token', data.token)
      localStorage.setItem('jobos_user', JSON.stringify(data.user))
      onAuth(data.token, data.user)
      toast.success('Signed in with Google')
    } catch (e) { toast.error(e.message) }
  }

  useEffect(() => {
    if (!open) return
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return
    const init = () => {
      if (!window.google?.accounts?.id || !btnRef.current) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
        ux_mode: 'popup',
      })
      btnRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(btnRef.current, {
        type: 'standard', theme: 'filled_black', size: 'large',
        text: mode === 'login' ? 'signin_with' : 'signup_with',
        shape: 'rectangular', width: 360,
      })
      setGsiReady(true)
    }
    if (window.google?.accounts?.id) init()
    else {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true; s.defer = true
      s.onload = init
      document.head.appendChild(s)
    }
  }, [open, mode])

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

        <div className="flex justify-center min-h-[44px]">
          <div ref={btnRef} data-testid="google-signin-btn" />
        </div>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
          <div className="relative flex justify-center"><span className="bg-background px-2 text-xs text-muted-foreground">or with email</span></div>
        </div>

        <form onSubmit={submit} className="space-y-3">
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
function Dashboard({ token, user, setUser, onNav }) {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    api('/dashboard/stats', { token }).then(setStats).catch(() => {})
  }, [token])

  const cards = [
    { label: 'Applications', value: stats?.stats?.total ?? 0, icon: Briefcase },
    { label: 'Interviews', value: stats?.stats?.interview ?? 0, icon: Target },
    { label: 'Offers', value: stats?.stats?.offer ?? 0, icon: Trophy },
    { label: 'Resume Score', value: `${stats?.resume_score ?? 0}%`, icon: FileText },
  ]
  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {user.name} <span className="opacity-60">👋</span></h1>
          <p className="text-muted-foreground mt-1">Here&apos;s your career mission control.</p>
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => onNav('jobs')}><Sparkles className="mr-2 h-4 w-4" /> Discover Jobs</Button>
            </TooltipTrigger>
            <TooltipContent>Browse AI-ranked opportunities</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={() => onNav('tracker')}><Kanban className="mr-2 h-4 w-4" /> Open Tracker</Button>
            </TooltipTrigger>
            <TooltipContent>Open your Kanban board</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mt-8">
        {cards.map((c, i) => (
          <Card key={i} className="card-glow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{c.value}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-foreground/5 flex items-center justify-center">
                  <c.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resume Upload widget — front & center on dashboard */}
      <Card className="card-glow mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Your Resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResumeUploader token={token} user={user} setUser={setUser} />
          <p className="text-xs text-muted-foreground mt-3">
            Your resume powers every AI feature — match scoring, cover letters, and interview prep.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <Card className="card-glow md:col-span-2">
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
                    <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
                      <div className="h-full bg-foreground/60" style={{ width: `${(val / max) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => onNav('jobs')}>
              <Search className="mr-2 h-4 w-4" /> Find matching jobs
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => onNav('profile')}>
              <User className="mr-2 h-4 w-4" /> Update your skills
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => onNav('interview')}>
              <GraduationCap className="mr-2 h-4 w-4" /> Practice interview
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
function MatchDialog({ open, job, token, user, onClose, onAddedToTracker, models, defaultModel }) {
  const [modelId, setModelId] = useState(user?.preferred_model || defaultModel || 'gemini-2.5-pro')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [clLoading, setClLoading] = useState(false)

  useEffect(() => { if (open) { setResult(null); setCoverLetter('') } }, [open, job])
  useEffect(() => { if (defaultModel && !user?.preferred_model) setModelId(defaultModel) }, [defaultModel, user])

  const runMatch = async () => {
    setLoading(true); setResult(null)
    try {
      const d = await api('/ai/match', { token, method: 'POST', body: { jobId: job.id, modelId } })
      setResult(d.match)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  const genCover = async () => {
    setClLoading(true)
    try {
      const d = await api('/ai/cover-letter', { token, method: 'POST', body: { jobId: job.id, modelId } })
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
  const activeModel = models.find(m => m.id === modelId)

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

        <div className="flex items-center gap-3 border border-white/10 rounded-lg p-3 flex-wrap">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm">AI Model:</span>
          <Select value={modelId} onValueChange={setModelId}>
            <SelectTrigger className="w-64 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {models.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
              ))}
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
            <p className="mt-3 text-sm text-muted-foreground">Analyzing with {activeModel?.label || modelId}...</p>
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
function Profile({ token, user, setUser, models = [], defaultModel = 'gemini-2.5-pro' }) {
  const [name, setName] = useState(user.name || '')
  const [title, setTitle] = useState(user.title || '')
  const [location, setLocation] = useState(user.location || '')
  const [skills, setSkills] = useState((user.skills || []).join(', '))
  const [resumeText, setResumeText] = useState(user.resume_text || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(user.name || '')
    setTitle(user.title || '')
    setLocation(user.location || '')
    setSkills((user.skills || []).join(', '))
    setResumeText(user.resume_text || '')
  }, [user])

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

  const handleFile = null // legacy — replaced by ResumeUploader

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
              <Select value={user.preferred_model || defaultModel} onValueChange={async (v) => {
                const d = await api('/profile', { token, method: 'PATCH', body: { preferred_model: v } })
                setUser(d.user); localStorage.setItem('jobos_user', JSON.stringify(d.user))
              }}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {models.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
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
            <label className="text-sm text-muted-foreground">Resume</label>
            <div className="mt-1.5">
              <ResumeUploader token={token} user={user} setUser={setUser} />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Or paste / edit resume text</label>
            <Textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
              placeholder="Your parsed resume will appear here. You can edit or paste text directly."
              className="mt-1.5 min-h-[180px]" />
            <p className="text-xs text-muted-foreground mt-1">{resumeText.length} chars</p>
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

// ---------- Interview Coach ----------
function Interview({ token, user, models, defaultModel }) {
  const [rounds, setRounds] = useState([])
  const [round, setRound] = useState(null)
  const [modelId, setModelId] = useState(user?.preferred_model || defaultModel || 'gemini-flash-latest')
  const [session, setSession] = useState(null)
  const [current, setCurrent] = useState(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [history, setHistory] = useState([])
  const [report, setReport] = useState(null)
  const [progress, setProgress] = useState({ answered: 0, total: 5 })
  const [total, setTotal] = useState(5)
  const [voiceOn, setVoiceOn] = useState(false)
  const recognitionRef = useRef(null)
  const [listening, setListening] = useState(false)

  useEffect(() => {
    api('/interview/rounds').then(d => setRounds(d.rounds || [])).catch(() => {})
  }, [])

  const speak = (text) => {
    if (!voiceOn || typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1; u.pitch = 1
    window.speechSynthesis.speak(u)
  }

  const startMic = () => {
    const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null
    if (!SR) { toast.error('Voice input not supported in this browser'); return }
    const rec = new SR()
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US'
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ')
      setAnswer(prev => prev ? `${prev} ${t}` : t)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }
  const stopMic = () => { recognitionRef.current?.stop(); setListening(false) }

  const start = async (r) => {
    setStarting(true); setRound(r); setReport(null); setHistory([])
    try {
      const d = await api('/interview/start', { token, method: 'POST', body: { round: r.id, modelId, total } })
      setSession(d.session); setCurrent(d.currentQuestion)
      setProgress({ answered: 0, total: d.session.total })
      speak(d.currentQuestion?.question || '')
    } catch (e) { toast.error(e.message); setRound(null) }
    finally { setStarting(false) }
  }

  const submit = async () => {
    if (!answer.trim()) return
    setLoading(true)
    try {
      const d = await api('/interview/answer', {
        token, method: 'POST', body: { sessionId: session.id, answer }
      })
      setHistory(prev => [...prev, { ...d.evaluation }])
      setProgress(d.progress || progress)
      setAnswer('')
      if (d.done) {
        setReport(d.report); setCurrent(null); setSession(prev => ({ ...prev, status: 'completed' }))
        speak(`Interview complete. Overall score ${d.report?.overall_score ?? ''}. Verdict: ${d.report?.verdict ?? ''}.`)
      } else {
        setCurrent(d.nextQuestion)
        speak(d.nextQuestion?.question || '')
      }
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const reset = () => { setRound(null); setSession(null); setCurrent(null); setReport(null); setHistory([]); setAnswer('') }

  // Round selection screen
  if (!round) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">AI Interview Coach</h1>
            <p className="text-muted-foreground mt-1">Pick a round and practice with real-time AI feedback and scoring.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Model:</span>
              <Select value={modelId} onValueChange={setModelId}>
                <SelectTrigger className="w-56 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {models.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Questions:</span>
              <Select value={String(total)} onValueChange={(v) => setTotal(Number(v))}>
                <SelectTrigger className="w-20 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 5, 7, 10].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rounds.map(r => (
            <Card key={r.id} className="card-glow border-white/5 hover:border-primary/40 transition group cursor-pointer" onClick={() => start(r)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                </div>
                <h3 className="mt-4 font-medium">{r.label}</h3>
                <p className="text-sm text-muted-foreground mt-1.5">{r.desc}</p>
                <Button size="sm" className="mt-4" disabled={starting}>
                  {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Start round <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></>}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Active session or report
  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground">← Back to rounds</button>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">{round.label}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" variant={voiceOn ? 'default' : 'outline'} onClick={() => setVoiceOn(v => !v)}>
            {voiceOn ? '🔊 Voice On' : '🔇 Voice Off'}
          </Button>
          <div className="text-sm text-muted-foreground">
            {progress.answered}/{progress.total}
          </div>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-6">
        <div className="h-full bg-primary transition-all" style={{ width: `${(progress.answered / progress.total) * 100}%` }} />
      </div>

      {history.map((h, i) => (
        <Card key={i} className="card-glow border-white/5 mb-3">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Q{i + 1}</p>
            <p className="font-medium mt-1">{h.question}</p>
            <div className="mt-3 rounded-md bg-white/[0.03] p-3">
              <p className="text-xs text-muted-foreground mb-1">Your answer</p>
              <p className="text-sm">{h.answer}</p>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Badge className={`${h.score >= 7 ? 'bg-green-500/15 text-green-400 border-green-500/30' : h.score >= 4 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>Score {h.score}/10</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-3">{h.feedback}</p>
          </CardContent>
        </Card>
      ))}

      {current && !report && (
        <Card className="card-glow border-primary/30 mb-4">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Question {progress.answered + 1}</span>
            </div>
            <p className="mt-3 text-lg font-medium">{current.question}</p>
            {current.hint && <p className="text-xs text-muted-foreground mt-2">💡 {current.hint}</p>}

            <Textarea value={answer} onChange={e => setAnswer(e.target.value)}
              placeholder="Type your answer here..." className="mt-4 min-h-[140px]" />
            <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex gap-2">
                {!listening ? (
                  <Button size="sm" variant="outline" onClick={startMic} type="button">🎤 Speak</Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={stopMic} type="button">⏹ Stop</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setAnswer('')}>Clear</Button>
              </div>
              <Button onClick={submit} disabled={loading || !answer.trim()}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating...</> : <>Submit answer <ArrowRight className="ml-1.5 h-4 w-4" /></>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {report && (
        <Card className="card-glow border-primary/40 mt-4">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Interview Report</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 p-5 text-center">
                <p className="text-xs text-muted-foreground uppercase">Overall Score</p>
                <p className="text-5xl font-semibold mt-2 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">{report.overall_score ?? '—'}</p>
                <p className="text-sm text-muted-foreground mt-1">out of 100</p>
              </div>
              <div className="rounded-xl border border-white/10 p-5">
                <p className="text-xs text-muted-foreground uppercase">Verdict</p>
                <p className="text-2xl font-semibold mt-2">{report.verdict}</p>
                <p className="text-sm text-muted-foreground mt-3">
                  {history.length} questions answered in this {round.label} round.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3 mt-4">
              {[
                { title: 'Strengths', items: report.strengths || [], icon: CheckCircle2, color: 'text-green-400' },
                { title: 'Weak Areas', items: report.weak_areas || [], icon: TrendingUp, color: 'text-amber-400' },
                { title: 'Recommendations', items: report.recommendations || [], icon: Rocket, color: 'text-primary' },
              ].map((sec, i) => (
                <div key={i} className="rounded-lg border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <sec.icon className={`h-4 w-4 ${sec.color}`} />
                    <p className="text-sm font-medium">{sec.title}</p>
                  </div>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {sec.items.map((it, j) => <li key={j} className="flex gap-2">• <span>{it}</span></li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <Button onClick={reset}><Sparkles className="mr-2 h-4 w-4" /> Try another round</Button>
            </div>
          </CardContent>
        </Card>
      )}
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
  const [models, setModels] = useState([])
  const [defaultModel, setDefaultModel] = useState('gemini-2.5-pro')

  useEffect(() => {
    const t = localStorage.getItem('jobos_token')
    const u = localStorage.getItem('jobos_user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    api('/models').then(d => { setModels(d.models || []); if (d.default) setDefaultModel(d.default) }).catch(() => {})
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
          {nav === 'dashboard' && <Dashboard token={token} user={user} setUser={setUser} onNav={setNav} />}
          {nav === 'jobs' && <Jobs token={token} user={user} onOpenMatch={setMatchJob} onRefreshApps={() => setAppsKey(k => k + 1)} />}
          {nav === 'tracker' && <Tracker token={token} refreshKey={appsKey} />}
          {nav === 'interview' && <Interview token={token} user={user} models={models} defaultModel={defaultModel} />}
          {nav === 'profile' && <Profile token={token} user={user} setUser={setUser} models={models} defaultModel={defaultModel} />}
        </motion.div>
      </AnimatePresence>
      <MatchDialog
        open={!!matchJob} job={matchJob} token={token} user={user}
        models={models} defaultModel={defaultModel}
        onClose={() => setMatchJob(null)}
        onAddedToTracker={() => setAppsKey(k => k + 1)}
      />
    </div>
  )
}

export default App
