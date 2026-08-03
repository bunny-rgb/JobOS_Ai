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
  Phase 3 UI polish + resume upload upgrade + tooltips:
  1) Minimalist black/grey gradient UI (removed heavy blue accent; primary is now white/near-white).
  2) Resume upload now accepts PDF, DOCX, TXT, MD via /api/profile/resume-upload (multipart).
     Parses PDF with pdf-parse, DOCX with mammoth, stores text on user.resume_text and filename on user.resume_filename.
  3) A ResumeUploader widget is on the Dashboard (front page after login) AND on Profile — drag&drop supported.
  4) Tooltips (radix Tooltip) on all icon buttons — theme toggle, logout, logo, and all nav items.
  5) Logo click routes to Dashboard when authenticated (main app page).

backend:
  - task: "Resume upload /api/profile/resume-upload (PDF/DOCX/TXT/MD)"
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
          POST multipart/form-data with `file` field. Server chooses parser by extension:
            - .pdf -> pdf-parse
            - .docx -> mammoth extractRawText
            - .txt / .md -> utf8 buffer
          Rejects size > 8MB (413) and unsupported extensions (400).
          Saves resume_text (trimmed to 20k chars) and resume_filename on user, returns updated user + chars + filename.

  - task: "All Phase 1 + Phase 2 endpoints"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Auth, jobs, applications, dashboard, AI Match, AI Cover Letter, Interview, Google OAuth - all previously passed."

frontend:
  - task: "Minimalist black/grey UI + clickable logo + tooltips + resume upload widget"
    implemented: true
    working: "NA"
    file: "app/page.js, app/globals.css, app/providers.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          - Color palette re-tuned: black bg gradient, white primary, subtle border.
          - TooltipProvider wraps app; NavBar icons (theme toggle, logout, logo, nav items) all show tooltips on hover.
          - Logo becomes a button that calls onNav('dashboard') when authenticated.
          - New ResumeUploader component (drag & drop + click) mounted:
              a) On Dashboard as a "Your Resume" card at the top.
              b) On Profile page as the primary resume input.
          - Multipart POST to /api/profile/resume-upload with the file; updates local user in localStorage + state on success.

metadata:
  created_by: "main_agent"
  version: "3.0"
  test_sequence: 2
  run_ui: true

test_plan:
  current_focus:
    - "Resume upload /api/profile/resume-upload (PDF/DOCX/TXT/MD)"
    - "Minimalist black/grey UI + clickable logo + tooltips + resume upload widget"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Please test:

      BACKEND:
      1) Auth: register a fresh user (unique email), grab token.
      2) POST /api/profile/resume-upload with a TXT file (create in /tmp with a small resume paragraph). Multipart form field name is "file".
         Assert 200, user.resume_text non-empty, chars > 0, filename matches upload.
      3) POST /api/profile/resume-upload with a DOCX file - you'll need to build one; you can use python-docx (`pip install python-docx` then create a Document with a few paragraphs).
         Assert 200 and text extracted.
      4) POST /api/profile/resume-upload with a PDF file - use reportlab to generate a small PDF with a few strings of resume content.
         Assert 200 and text extracted.
      5) POST with an unsupported extension (.jpg) — assert 400.
      6) POST without file field — assert 400.
      7) POST without auth header — assert 401.

      Also do a quick sanity re-check that /api/dashboard/stats and /api/jobs still work post-changes.

      FRONTEND (only after backend passes):
      1) Landing page renders in the new minimalist black/grey look.
      2) Hover over the "J" logo when logged in — tooltip "Go to Dashboard" appears.
      3) Hover over LogOut icon — tooltip "Sign out" appears.
      4) Click the "J" logo when on Jobs/Tracker/Interview page — should navigate back to Dashboard.
      5) On Dashboard, the "Your Resume" card is present with a "Choose file" button. Upload a small .txt file — success toast, filename shown, chars parsed shown.
      6) On Profile, the same ResumeUploader is present and also uploads.
