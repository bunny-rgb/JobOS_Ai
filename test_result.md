#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================
# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK
#
# Communication Protocol:
# Main and testing agents must follow this exact format to maintain testing data.
#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

user_problem_statement: |
  JobOS AI - Phase 2 additions:
  1) Google OAuth Sign-In (Google Identity Services + ID token verification server-side)
  2) AI Interview Coach: round picker (QA, SQL, HR, Behavioral, System Design, Manager) + Q/A loop
     with per-answer scoring and a final report (overall_score, verdict, strengths, weak_areas,
     recommendations). Voice mode using Web Speech API.
  3) Frontend UI test of Kanban drag-drop and AI Match flows.

backend:
  - task: "Google OAuth /api/auth/google"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/auth/google verifies Google ID token via google-auth-library OAuth2Client.verifyIdToken with audience=GOOGLE_CLIENT_ID. Creates/updates user by google_sub (fallback email), issues JobOS JWT. Invalid credential returns 401 (verified via curl)."
      - working: true
        agent: "testing"
        comment: "✅ PASSED - Tested negative paths: (1) Invalid credential returns 401 with error message, (2) Missing credential returns 400, (3) Null credential returns 400. All error handling working correctly. Cannot test positive path headlessly as we cannot mint real Google ID tokens."

  - task: "AI Interview: rounds + start + answer + sessions"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Endpoints:
          - GET /api/interview/rounds -> list of 6 rounds
          - POST /api/interview/start {round, modelId, total} -> creates session, returns first Q
          - POST /api/interview/answer {sessionId, answer} -> evaluates, returns next Q or final report
          - GET /api/interview/sessions -> history
          Uses gemini-flash-latest by default (via /lib/llm.js).
      - working: true
        agent: "testing"
        comment: |
          ✅ PASSED - Full interview flow tested successfully:
          1) GET /api/interview/rounds returns 6 rounds (qa, sql, hr, behavioral, system_design, manager) with id/label/desc
          2) POST /api/interview/start with round=qa, modelId=gemini-flash-latest, total=3 creates session and returns first question
          3) POST /api/interview/answer (3 times) evaluates answers with score 0-10, feedback, and next question
          4) Final answer returns done=true, report with overall_score (0-100), verdict (Weak/Needs Work/Solid/Strong/Excellent), strengths[], weak_areas[], recommendations[]
          5) GET /api/interview/sessions returns completed session with report
          6) POST /api/interview/answer to completed session returns 400 error
          7) Tested with openai/gpt-4o-mini model - works correctly
          Note: First test run encountered temporary Gemini API 503 (high demand), retry succeeded. Both gemini-flash-latest and openai/gpt-4o-mini models working.

  - task: "Auth register/login/me (email+password)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Passed in Phase 1. Login now guards against null password_hash for Google-only users."

  - task: "Jobs, Applications, Dashboard, Profile"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "All CRUD + seed passed in Phase 1."

  - task: "AI Match + Cover Letter"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js, lib/llm.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Verified with gemini-flash-latest and openai/gpt-4o-mini in Phase 1 re-test."

frontend:
  - task: "Google Sign-In button in AuthDialog"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Renders Google Identity Services button (client_id from NEXT_PUBLIC_GOOGLE_CLIENT_ID). On credential response, POSTs to /api/auth/google."

  - task: "AI Interview Coach UI (round picker, Q&A, voice, report)"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Interview tab with round cards, Q&A loop, voice mode (Web Speech API), progress bar, and final report."

  - task: "Kanban drag-drop + AI Match flow"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Existing Kanban tracker with HTML5 drag-drop across 6 stages. AI Match dialog invokes /api/ai/match."

metadata:
  created_by: "main_agent"
  version: "2.0"
  test_sequence: 2
  run_ui: true

test_plan:
  current_focus:
    - "AI Interview Coach UI (round picker, Q&A, voice, report)"
    - "Kanban drag-drop + AI Match flow"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Phase 2 built. Please test:
      1) /api/auth/google with invalid credential -> 401 (already curl-verified). We cannot
         obtain a valid Google ID token in headless testing, so only assert the 401 path server-side.
      2) /api/interview/rounds -> 6 rounds returned
      3) POST /api/interview/start with round="qa", modelId="gemini-flash-latest", total=3 -> returns session + currentQuestion
      4) POST /api/interview/answer with a plausible QA answer -> returns evaluation + nextQuestion; repeat 3 times total, final call must return report with overall_score, verdict, strengths, weak_areas, recommendations, and done:true
      5) Test also with modelId="openai/gpt-4o-mini" (uses OpenRouter path)
      6) GET /api/interview/sessions -> returns array
      Use unique test email each run.
  - agent: "testing"
    message: |
      ✅ Phase 2 Backend Testing Complete - ALL TESTS PASSED (14/14)
      
      Tested and verified:
      A) Google OAuth /api/auth/google - All negative paths working (401 for invalid token, 400 for missing/null credential)
      B) AI Interview Coach - Full flow tested:
         - GET /api/interview/rounds returns 6 rounds with correct structure
         - POST /api/interview/start creates session with first question (tested with gemini-flash-latest)
         - POST /api/interview/answer evaluates answers with score/feedback/next question
         - Final answer returns complete report with overall_score, verdict, strengths, weak_areas, recommendations
         - GET /api/interview/sessions returns completed sessions with reports
         - Completed session correctly rejects new answers with 400
      C) Multiple models tested - Both gemini-flash-latest and openai/gpt-4o-mini working correctly
      
      Note: Encountered temporary Gemini API 503 error (high demand) on first run, retry succeeded. This is an external API rate limit, not a code issue.
      
      Backend APIs are production-ready. Frontend testing remains (UI components, Google Sign-In button, Interview Coach UI, Kanban drag-drop).
