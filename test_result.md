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
  Bug fixes for Phase 4:
  A) Country filter did not work - showed US jobs when user set India.
  B) Jobs weren't filtered by resume/preference relevance.
  C) React warning "Encountered two children with the same key ext_xxx" while infinite-scrolling.

  Fixes applied:
  1) lib/jobFetcher.js now uses source-prefixed IDs (remotive-*, remoteok-*, arbeitnow-*, jobicy-*) so keys never collide.
  2) inferCountry(location) added with word-boundary regexes for 30+ countries; each external job is tagged with
     an ISO 2-letter country code on ingest.
  3) /api/jobs country filter is now STRICT: only {country: X} OR {remote:true, worldwide:true}.
     Previously it also matched {country: null} which basically included everything.
  4) /api/jobs is now RELEVANCE-AWARE for authenticated users: reads user.skills + user.target_role + user.resume_text,
     computes a _relevance score per job (skill overlap x4, target-role token match x6, resume mention x2),
     sorts by that, and filters to _relevance > 0 when the user has any context. Client can opt out with ?smart=false.
  5) ensureSeed now upserts seed jobs on every boot so schema updates (country, apply_url) propagate to existing rows.
  6) Frontend Jobs list uses composite key `${source}-${id}-${idx}` (belt-and-suspenders).
  7) Frontend gets a "Match my resume" toggle in the filter bar (default ON) tied to ?smart param.

backend:
  - task: "Country filter (strict) + inferred country from location string"
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
          Country filter now: {$or: [{country: <cc>}, {remote:true, worldwide:true}]}
          External jobs now have `country` (ISO 2 letters) computed from location string, and `worldwide:true` when
          location says Anywhere/Worldwide/Global. Word-boundaries in the regex avoid the "Indiana" → IN false positive.
          Verified via curl: /api/jobs?country=IN returns 13 jobs (seeds + remotive worldwide + remoteok Noida job).
          US Indiana no longer tagged as IN.

  - task: "Relevance-aware /api/jobs (smart mode)"
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
          When ?smart!=false and Bearer token present, jobs are scored:
            _relevance = 4*skill_overlap + 6*(target_role token in title/category) + 2*resume_text mentions
          Sorted by _relevance desc, then createdAt desc. If any relevance signals exist, filter to _relevance > 0
          (with fallback to full list to keep page 1 filled). Returns `smart: true` in response.

  - task: "ensureSeed idempotent upsert"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "bulkWrite upserts by (title,company) each boot to backfill new fields like country/apply_url."

frontend:
  - task: "Unique React keys + Match my resume toggle"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "key=`${source}-${id}-${idx}`; smart toggle wired to ?smart param and included in useEffect deps."

metadata:
  created_by: "main_agent"
  version: "4.1"
  test_sequence: 4
  run_ui: false

test_plan:
  current_focus:
    - "Country filter (strict) + inferred country from location string"
    - "Relevance-aware /api/jobs (smart mode)"
    - "ensureSeed idempotent upsert"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Please test the /api/jobs country + relevance behavior:

      1) POST /api/jobs/refresh (assert > 100 refreshed).
      2) GET /api/jobs?country=IN&limit=20&smart=false (no auth)
         - assert 200 and every returned job has country == "IN" OR (remote:true AND worldwide:true).
         - assert seed jobs Infosys/Zoho/Razorpay/TCS are present with country == "IN".
         - assert NO US-only jobs (e.g., "New York" or "California" locations) leak through.
      3) GET /api/jobs?country=US&limit=20&smart=false — assert every job country == "US" or remote+worldwide.
      4) GET /api/jobs?country=IN&smart=false&limit=20 vs GET /api/jobs?country=US&smart=false&limit=20 — different job sets.
      5) Register a new user, PATCH /api/profile with skills:["Playwright","TypeScript","SQL"], target_role:"QA Engineer".
      6) GET /api/jobs?smart=true (default) WITH Bearer token — assert response includes `smart:true`, and the FIRST job
         has jobs.skills containing at least one of the user's skills, OR the title/category contains "qa" or "engineer".
         The Stripe/Zoho QA seeds should rank high.
      7) GET /api/jobs?smart=false with Bearer token — assert `smart:false` and pure recency order (createdAt desc).
      8) Combined: GET /api/jobs?country=IN&smart=true with Bearer token whose skills are ["SQL","Airflow","Python"]
         and target_role="Data Engineer" — assert Razorpay Data Engineer seed appears near the top.
      9) Ensure NO duplicate ids in /api/jobs response over 3 pages (page=1,2,3).

      Sanity: /api/dashboard/stats, /api/models, /api/geo still 200.
