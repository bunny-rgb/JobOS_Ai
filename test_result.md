#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================
# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK
# Communication Protocol: Main and testing agents must follow this exact format.
#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

user_problem_statement: |
  Phase 4 - Job platform upgrade:
  1) Apply Now button - actually applies (opens recruiter URL) and moves to Applied stage.
  2) AI-driven Resume Score tied to user's chosen target role (SDE, PM, etc.) - not a heuristic.
     User can change target role on the Dashboard front page.
  3) Real job aggregation from multiple free public APIs (Remotive, RemoteOK, Arbeitnow, Jobicy) with
     pagination + infinite scroll. Total ~300+ jobs available at any time.
  4) Country auto-detect via Cf-IPCountry / X-Vercel-IP-Country headers, salary shown in INR when country=IN,
     manual country switcher in the Jobs page.

backend:
  - task: "Job aggregation from external APIs with pagination"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js, lib/jobFetcher.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          - New /lib/jobFetcher.js pulls from Remotive, RemoteOK, Arbeitnow, Jobicy (public, no key needed).
          - POST /api/jobs/refresh triggers a hard refresh (bulk upsert to Mongo). Verified curl returns {refreshed: 331}.
          - GET /api/jobs?page=1&limit=24&q=...&remote=true&country=IN&refresh=false returns
            {jobs, page, limit, total, hasMore, country, currency, lastRefreshed}.
          - Country filter respects seed 'country' field OR remote:true OR null country.
          - Currency conversion helper: USD → INR when country=IN via USD_TO_INR (=83.5).
          - Salary field added: salary_display alongside original salary.
          - maybeRefreshJobs runs on GET /api/jobs when cache is stale (>1h) — fire and forget.

  - task: "AI Resume Score for target role"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          POST /api/ai/resume-score {target_role, modelId}
          Requires resume_text on user. Returns
          {analysis:{score:0-100, verdict, matched_skills[], missing_skills[], strengths[],
                     gaps[], keyword_hits, ats_notes, recommendation, improvements[]}, user}.
          Persists to user.last_resume_analysis {target_role, modelId, analysis, at}.
          Also updates user.target_role to the analyzed role.

  - task: "Apply Now endpoint (Applications POST returns apply_url + accepts stage upgrade for duplicates)"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          POST /api/applications now returns {application, apply_url} — client opens URL in a new tab.
          If a duplicate exists AND a new stage is provided, the existing app is upgraded to that stage
          (e.g. Interested → Applied). If no stage change requested, 409 duplicate.

  - task: "Geo detect endpoint /api/geo"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          GET /api/geo reads Cf-IPCountry / X-Vercel-IP-Country / X-Country headers and returns
          {country, currency}. Defaults country="US" if no header present.

  - task: "Profile PATCH accepts target_role/country/currency"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Extended allowed[] to include target_role, country, currency."

frontend:
  - task: "Jobs page: infinite scroll, country switcher, Apply Now button, salary display"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "IntersectionObserver on sentinel; ~24 jobs/page; hasMore controls further fetches. Country Select in header; 'Sync fresh jobs' button; per-card Apply Now button opens apply_url and moves app to Applied stage."

  - task: "Dashboard: target role picker + AI Resume Score card"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "New Dashboard section: pick target role from 20+ options or type custom → 'Analyze resume' → shows score ring, verdict, matched/missing skills, and improvement bullets."

metadata:
  created_by: "main_agent"
  version: "4.0"
  test_sequence: 3
  run_ui: false

test_plan:
  current_focus:
    - "Job aggregation from external APIs with pagination"
    - "AI Resume Score for target role"
    - "Apply Now endpoint (Applications POST returns apply_url + accepts stage upgrade for duplicates)"
    - "Geo detect endpoint /api/geo"
    - "Profile PATCH accepts target_role/country/currency"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Phase 4 backend built. Please test:

      1) POST /api/jobs/refresh -> {refreshed: > 100}
      2) GET /api/jobs -> {jobs: array (len==limit or fewer), total > 200, hasMore: boolean, currency, country, lastRefreshed:string}
      3) GET /api/jobs?page=2 -> different subset
      4) GET /api/jobs?q=engineer&remote=true -> filtered
      5) GET /api/jobs?country=IN -> jobs where country==IN OR remote or country==null
      6) GET /api/geo -> {country:"US" default, currency:"USD"}
      7) POST /api/ai/resume-score with target_role="Product Manager" and modelId="gemini-flash-latest" AFTER uploading a resume via /api/profile/resume-upload — expect {analysis:{score, verdict, matched_skills, missing_skills, strengths, gaps, keyword_hits, ats_notes, recommendation, improvements}, user}
      8) POST /api/ai/resume-score without a resume_text on user -> 400
      9) POST /api/applications {jobId, stage:'interested'} -> {application, apply_url:string|null}
      10) POST /api/applications {jobId (same), stage:'applied'} -> should upgrade stage, returns {application, apply_url, updated:true}
      11) POST /api/applications {jobId (same), stage:'interested'} again with same stage -> 409
      12) PATCH /api/profile {target_role:"Data Scientist", country:"IN"} -> user reflects both
      13) Sanity: /api/dashboard/stats, /api/models, /api/interview/rounds, /api/auth/me all still 200.

      Use unique test email each run. LLM calls up to 60s.
