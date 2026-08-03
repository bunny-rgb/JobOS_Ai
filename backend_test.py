#!/usr/bin/env python3
"""
JobOS AI Backend API End-to-End Test Suite
Tests all backend endpoints including AI Match with both OpenAI and Anthropic providers
"""

import requests
import json
import time
from datetime import datetime

# Load base URL from .env
BASE_URL = "https://26f7e9d2-a7c5-4a81-a4a6-e725fa407223.preview.emergentagent.com/api"

# Test data
timestamp = int(time.time())
TEST_EMAIL = f"qa_test_{timestamp}@jobos.ai"
TEST_PASSWORD = "SecurePass123!"
TEST_NAME = "QA Test Engineer"

# Global variables to store state
token = None
user_id = None
job_id = None
application_id = None

def print_test(name):
    print(f"\n{'='*80}")
    print(f"TEST: {name}")
    print('='*80)

def print_success(msg):
    print(f"✅ SUCCESS: {msg}")

def print_error(msg):
    print(f"❌ ERROR: {msg}")

def print_info(msg):
    print(f"ℹ️  INFO: {msg}")

# ============================================================================
# 1. HEALTH CHECK
# ============================================================================
def test_health():
    print_test("Health Check - GET /api/")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "JobOS AI API":
                print_success("Health check passed")
                return True
            else:
                print_error(f"Unexpected message: {data.get('message')}")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Health check failed: {str(e)}")
        return False

# ============================================================================
# 2. AUTH - REGISTER
# ============================================================================
def test_auth_register():
    global token, user_id
    print_test("Auth Register - POST /api/auth/register")
    try:
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                token = data["token"]
                user_id = data["user"].get("id")
                print_success(f"Registration successful. User ID: {user_id}")
                print_info(f"Token: {token[:20]}...")
                return True
            else:
                print_error("Missing token or user in response")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Registration failed: {str(e)}")
        return False

# ============================================================================
# 3. AUTH - DUPLICATE REGISTER (should fail with 409)
# ============================================================================
def test_auth_register_duplicate():
    print_test("Auth Register Duplicate - POST /api/auth/register (should fail 409)")
    try:
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 409:
            print_success("Duplicate registration correctly rejected with 409")
            return True
        else:
            print_error(f"Expected 409, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Duplicate registration test failed: {str(e)}")
        return False

# ============================================================================
# 4. AUTH - LOGIN
# ============================================================================
def test_auth_login():
    global token
    print_test("Auth Login - POST /api/auth/login")
    try:
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                token = data["token"]
                print_success("Login successful")
                return True
            else:
                print_error("Missing token or user in response")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Login failed: {str(e)}")
        return False

# ============================================================================
# 5. AUTH - LOGIN WITH WRONG PASSWORD (should fail with 401)
# ============================================================================
def test_auth_login_wrong_password():
    print_test("Auth Login Wrong Password - POST /api/auth/login (should fail 401)")
    try:
        payload = {
            "email": TEST_EMAIL,
            "password": "WrongPassword123!"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 401:
            print_success("Wrong password correctly rejected with 401")
            return True
        else:
            print_error(f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Wrong password test failed: {str(e)}")
        return False

# ============================================================================
# 6. AUTH - GET /me WITH TOKEN
# ============================================================================
def test_auth_me_with_token():
    print_test("Auth Me - GET /api/auth/me (with Bearer token)")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if "user" in data and data["user"].get("email") == TEST_EMAIL:
                print_success("Auth /me with token successful")
                return True
            else:
                print_error("User data mismatch")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Auth /me test failed: {str(e)}")
        return False

# ============================================================================
# 7. AUTH - GET /me WITHOUT TOKEN (should fail with 401)
# ============================================================================
def test_auth_me_without_token():
    print_test("Auth Me - GET /api/auth/me (without token, should fail 401)")
    try:
        response = requests.get(f"{BASE_URL}/auth/me", timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 401:
            print_success("Auth /me without token correctly rejected with 401")
            return True
        else:
            print_error(f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Auth /me without token test failed: {str(e)}")
        return False

# ============================================================================
# 8. PROFILE - PATCH
# ============================================================================
def test_profile_patch():
    print_test("Profile Update - PATCH /api/profile")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "skills": ["Playwright", "SQL", "TypeScript", "Python", "API Testing"],
            "resume_text": "5 years of QA automation experience with Playwright, Selenium, and API testing. Strong background in CI/CD pipelines and test framework design.",
            "title": "Senior QA Engineer",
            "location": "Bengaluru, India"
        }
        response = requests.patch(f"{BASE_URL}/profile", json=payload, headers=headers, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            if (user.get("title") == "Senior QA Engineer" and 
                "Playwright" in user.get("skills", [])):
                print_success("Profile updated successfully")
                return True
            else:
                print_error("Profile data mismatch")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Profile update failed: {str(e)}")
        return False

# ============================================================================
# 9. JOBS - GET ALL (should return 8 seed jobs)
# ============================================================================
def test_jobs_get_all():
    global job_id
    print_test("Jobs List - GET /api/jobs")
    try:
        response = requests.get(f"{BASE_URL}/jobs", timeout=10)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            jobs = data.get("jobs", [])
            print_info(f"Found {len(jobs)} jobs")
            
            if len(jobs) >= 8:
                # Store a job ID for later tests (pick QA job)
                for job in jobs:
                    if "QA" in job.get("title", ""):
                        job_id = job.get("id")
                        print_info(f"Selected job: {job.get('title')} at {job.get('company')} (ID: {job_id})")
                        break
                
                if not job_id and len(jobs) > 0:
                    job_id = jobs[0].get("id")
                    print_info(f"Selected first job: {jobs[0].get('title')} (ID: {job_id})")
                
                print_success(f"Jobs list retrieved successfully with {len(jobs)} jobs")
                return True
            else:
                print_error(f"Expected at least 8 seed jobs, got {len(jobs)}")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Jobs list failed: {str(e)}")
        return False

# ============================================================================
# 10. JOBS - FILTER BY KEYWORD
# ============================================================================
def test_jobs_filter_keyword():
    print_test("Jobs Filter - GET /api/jobs?q=qa")
    try:
        response = requests.get(f"{BASE_URL}/jobs?q=qa", timeout=10)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            jobs = data.get("jobs", [])
            print_info(f"Found {len(jobs)} jobs matching 'qa'")
            
            # Verify all jobs contain 'qa' in title, company, or skills
            all_match = True
            for job in jobs:
                title = job.get("title", "").lower()
                company = job.get("company", "").lower()
                skills = [s.lower() for s in job.get("skills", [])]
                
                if not ("qa" in title or "qa" in company or any("qa" in s for s in skills)):
                    print_error(f"Job doesn't match filter: {job.get('title')}")
                    all_match = False
            
            if all_match and len(jobs) > 0:
                print_success(f"Jobs filtered by keyword successfully ({len(jobs)} results)")
                return True
            elif len(jobs) == 0:
                print_error("No jobs found for 'qa' keyword")
                return False
            else:
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Jobs filter test failed: {str(e)}")
        return False

# ============================================================================
# 11. JOBS - FILTER BY REMOTE
# ============================================================================
def test_jobs_filter_remote():
    print_test("Jobs Filter - GET /api/jobs?remote=true")
    try:
        response = requests.get(f"{BASE_URL}/jobs?remote=true", timeout=10)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            jobs = data.get("jobs", [])
            print_info(f"Found {len(jobs)} remote jobs")
            
            # Verify all jobs are remote
            all_remote = all(job.get("remote") == True for job in jobs)
            
            if all_remote and len(jobs) > 0:
                print_success(f"Jobs filtered by remote successfully ({len(jobs)} results)")
                return True
            elif len(jobs) == 0:
                print_error("No remote jobs found")
                return False
            else:
                print_error("Some jobs are not remote")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Jobs remote filter test failed: {str(e)}")
        return False

# ============================================================================
# 12. AI MATCH - OPENAI (CRITICAL)
# ============================================================================
def test_ai_match_openai():
    print_test("AI Match - POST /api/ai/match (provider: openai) - CRITICAL")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "jobId": job_id,
            "provider": "openai"
        }
        print_info(f"Testing with job ID: {job_id}")
        print_info("This may take 10-30 seconds...")
        
        response = requests.post(f"{BASE_URL}/ai/match", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text[:1000]}")
        
        if response.status_code == 200:
            data = response.json()
            match = data.get("match", {})
            
            # Validate structure
            required_fields = ["match_percent", "matched_skills", "missing_skills", 
                             "strengths", "gaps", "recommendation", "verdict"]
            missing_fields = [f for f in required_fields if f not in match]
            
            if missing_fields:
                print_error(f"Missing fields in match response: {missing_fields}")
                return False
            
            # Validate types and values
            match_percent = match.get("match_percent")
            if not isinstance(match_percent, (int, float)) or not (0 <= match_percent <= 100):
                print_error(f"Invalid match_percent: {match_percent} (should be 0-100)")
                return False
            
            if not isinstance(match.get("matched_skills"), list):
                print_error("matched_skills should be an array")
                return False
            
            if not isinstance(match.get("missing_skills"), list):
                print_error("missing_skills should be an array")
                return False
            
            if not isinstance(match.get("strengths"), list):
                print_error("strengths should be an array")
                return False
            
            if not isinstance(match.get("gaps"), list):
                print_error("gaps should be an array")
                return False
            
            verdict = match.get("verdict")
            valid_verdicts = ["Strong Match", "Good Match", "Fair Match", "Weak Match"]
            if verdict not in valid_verdicts:
                print_error(f"Invalid verdict: {verdict} (should be one of {valid_verdicts})")
                return False
            
            print_info(f"Match Percent: {match_percent}%")
            print_info(f"Verdict: {verdict}")
            print_info(f"Matched Skills: {len(match.get('matched_skills', []))}")
            print_info(f"Missing Skills: {len(match.get('missing_skills', []))}")
            print_success("AI Match (OpenAI) successful with valid structure")
            return True
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"AI Match (OpenAI) failed: {str(e)}")
        return False

# ============================================================================
# 13. AI MATCH - ANTHROPIC (CRITICAL)
# ============================================================================
def test_ai_match_anthropic():
    print_test("AI Match - POST /api/ai/match (provider: anthropic) - CRITICAL")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "jobId": job_id,
            "provider": "anthropic"
        }
        print_info(f"Testing with job ID: {job_id}")
        print_info("This may take 10-30 seconds...")
        
        response = requests.post(f"{BASE_URL}/ai/match", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text[:1000]}")
        
        if response.status_code == 200:
            data = response.json()
            match = data.get("match", {})
            
            # Validate structure
            required_fields = ["match_percent", "matched_skills", "missing_skills", 
                             "strengths", "gaps", "recommendation", "verdict"]
            missing_fields = [f for f in required_fields if f not in match]
            
            if missing_fields:
                print_error(f"Missing fields in match response: {missing_fields}")
                return False
            
            # Validate types and values
            match_percent = match.get("match_percent")
            if not isinstance(match_percent, (int, float)) or not (0 <= match_percent <= 100):
                print_error(f"Invalid match_percent: {match_percent} (should be 0-100)")
                return False
            
            if not isinstance(match.get("matched_skills"), list):
                print_error("matched_skills should be an array")
                return False
            
            if not isinstance(match.get("missing_skills"), list):
                print_error("missing_skills should be an array")
                return False
            
            if not isinstance(match.get("strengths"), list):
                print_error("strengths should be an array")
                return False
            
            if not isinstance(match.get("gaps"), list):
                print_error("gaps should be an array")
                return False
            
            verdict = match.get("verdict")
            valid_verdicts = ["Strong Match", "Good Match", "Fair Match", "Weak Match"]
            if verdict not in valid_verdicts:
                print_error(f"Invalid verdict: {verdict} (should be one of {valid_verdicts})")
                return False
            
            print_info(f"Match Percent: {match_percent}%")
            print_info(f"Verdict: {verdict}")
            print_info(f"Matched Skills: {len(match.get('matched_skills', []))}")
            print_info(f"Missing Skills: {len(match.get('missing_skills', []))}")
            print_success("AI Match (Anthropic) successful with valid structure")
            return True
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"AI Match (Anthropic) failed: {str(e)}")
        return False

# ============================================================================
# 14. AI COVER LETTER - OPENAI
# ============================================================================
def test_ai_cover_letter():
    print_test("AI Cover Letter - POST /api/ai/cover-letter (provider: openai)")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "jobId": job_id,
            "provider": "openai"
        }
        print_info(f"Testing with job ID: {job_id}")
        print_info("This may take 10-30 seconds...")
        
        response = requests.post(f"{BASE_URL}/ai/cover-letter", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            cover_letter = data.get("cover_letter", "")
            
            if cover_letter and len(cover_letter) > 50:
                print_info(f"Cover letter length: {len(cover_letter)} characters")
                print_info(f"Preview: {cover_letter[:200]}...")
                print_success("AI Cover Letter generated successfully")
                return True
            else:
                print_error(f"Cover letter too short or empty: {len(cover_letter)} chars")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"AI Cover Letter failed: {str(e)}")
        return False

# ============================================================================
# 15. APPLICATIONS - CREATE
# ============================================================================
def test_applications_create():
    global application_id
    print_test("Applications Create - POST /api/applications")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "jobId": job_id,
            "stage": "interested",
            "match_percent": 82
        }
        response = requests.post(f"{BASE_URL}/applications", json=payload, headers=headers, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            app = data.get("application", {})
            application_id = app.get("id")
            
            if (application_id and 
                app.get("stage") == "interested" and 
                app.get("match_percent") == 82):
                print_success(f"Application created successfully (ID: {application_id})")
                return True
            else:
                print_error("Application data mismatch")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Application creation failed: {str(e)}")
        return False

# ============================================================================
# 16. APPLICATIONS - DUPLICATE (should fail with 409)
# ============================================================================
def test_applications_duplicate():
    print_test("Applications Duplicate - POST /api/applications (should fail 409)")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "jobId": job_id,
            "stage": "interested",
            "match_percent": 82
        }
        response = requests.post(f"{BASE_URL}/applications", json=payload, headers=headers, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 409:
            print_success("Duplicate application correctly rejected with 409")
            return True
        else:
            print_error(f"Expected 409, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Duplicate application test failed: {str(e)}")
        return False

# ============================================================================
# 17. APPLICATIONS - GET ALL
# ============================================================================
def test_applications_get():
    print_test("Applications List - GET /api/applications")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/applications", headers=headers, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            apps = data.get("applications", [])
            
            if len(apps) >= 1:
                print_success(f"Applications list retrieved successfully ({len(apps)} applications)")
                return True
            else:
                print_error("Expected at least 1 application")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Applications list failed: {str(e)}")
        return False

# ============================================================================
# 18. APPLICATIONS - UPDATE STAGE TO "applied"
# ============================================================================
def test_applications_update_applied():
    print_test("Applications Update - PATCH /api/applications/:id (stage: applied)")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {"stage": "applied"}
        response = requests.patch(f"{BASE_URL}/applications/{application_id}", 
                                json=payload, headers=headers, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            app = data.get("application", {})
            history = app.get("history", [])
            
            if app.get("stage") == "applied" and len(history) >= 2:
                print_success("Application updated to 'applied' with history entry")
                return True
            else:
                print_error(f"Stage or history mismatch. Stage: {app.get('stage')}, History length: {len(history)}")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Application update failed: {str(e)}")
        return False

# ============================================================================
# 19. APPLICATIONS - UPDATE STAGE TO "interview"
# ============================================================================
def test_applications_update_interview():
    print_test("Applications Update - PATCH /api/applications/:id (stage: interview)")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {"stage": "interview"}
        response = requests.patch(f"{BASE_URL}/applications/{application_id}", 
                                json=payload, headers=headers, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            app = data.get("application", {})
            history = app.get("history", [])
            
            if app.get("stage") == "interview" and len(history) >= 3:
                print_success("Application updated to 'interview' with history entry")
                return True
            else:
                print_error(f"Stage or history mismatch. Stage: {app.get('stage')}, History length: {len(history)}")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Application update failed: {str(e)}")
        return False

# ============================================================================
# 20. DASHBOARD STATS
# ============================================================================
def test_dashboard_stats():
    print_test("Dashboard Stats - GET /api/dashboard/stats")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/dashboard/stats", headers=headers, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            stats = data.get("stats", {})
            resume_score = data.get("resume_score")
            
            required_stats = ["total", "interested", "applied", "assessment", 
                            "interview", "offer", "rejected"]
            missing_stats = [s for s in required_stats if s not in stats]
            
            if missing_stats:
                print_error(f"Missing stats fields: {missing_stats}")
                return False
            
            if not isinstance(resume_score, (int, float)) or not (0 <= resume_score <= 100):
                print_error(f"Invalid resume_score: {resume_score}")
                return False
            
            print_info(f"Total applications: {stats.get('total')}")
            print_info(f"Interview stage: {stats.get('interview')}")
            print_info(f"Resume score: {resume_score}")
            print_success("Dashboard stats retrieved successfully")
            return True
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Dashboard stats failed: {str(e)}")
        return False

# ============================================================================
# 21. APPLICATIONS - DELETE
# ============================================================================
def test_applications_delete():
    print_test("Applications Delete - DELETE /api/applications/:id")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.delete(f"{BASE_URL}/applications/{application_id}", 
                                  headers=headers, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("deleted") == True:
                print_success("Application deleted successfully")
                return True
            else:
                print_error("Delete response missing 'deleted: true'")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Application deletion failed: {str(e)}")
        return False

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================
def main():
    print("\n" + "="*80)
    print("JobOS AI Backend API - End-to-End Test Suite")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Email: {TEST_EMAIL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("="*80)
    
    results = {}
    
    # Run all tests in sequence
    tests = [
        ("Health Check", test_health),
        ("Auth Register", test_auth_register),
        ("Auth Register Duplicate", test_auth_register_duplicate),
        ("Auth Login", test_auth_login),
        ("Auth Login Wrong Password", test_auth_login_wrong_password),
        ("Auth Me With Token", test_auth_me_with_token),
        ("Auth Me Without Token", test_auth_me_without_token),
        ("Profile Patch", test_profile_patch),
        ("Jobs Get All", test_jobs_get_all),
        ("Jobs Filter Keyword", test_jobs_filter_keyword),
        ("Jobs Filter Remote", test_jobs_filter_remote),
        ("AI Match OpenAI", test_ai_match_openai),
        ("AI Match Anthropic", test_ai_match_anthropic),
        ("AI Cover Letter", test_ai_cover_letter),
        ("Applications Create", test_applications_create),
        ("Applications Duplicate", test_applications_duplicate),
        ("Applications Get", test_applications_get),
        ("Applications Update Applied", test_applications_update_applied),
        ("Applications Update Interview", test_applications_update_interview),
        ("Dashboard Stats", test_dashboard_stats),
        ("Applications Delete", test_applications_delete),
    ]
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print_error(f"Test '{test_name}' crashed: {str(e)}")
            results[test_name] = False
        
        # Small delay between tests
        time.sleep(0.5)
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    failed = sum(1 for v in results.values() if not v)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("="*80)
    print(f"Total: {len(results)} | Passed: {passed} | Failed: {failed}")
    print("="*80)
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️  {failed} TEST(S) FAILED")
        return 1

if __name__ == "__main__":
    exit(main())
