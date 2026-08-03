#!/usr/bin/env python3
"""
JobOS AI - AI Endpoints Test Suite
Tests the new Gemini + OpenRouter API integration (replacing Emergent SDK)
"""

import requests
import json
import time
from datetime import datetime

# Load base URL from .env
BASE_URL = "https://26f7e9d2-a7c5-4a81-a4a6-e725fa407223.preview.emergentagent.com/api"

# Test data
timestamp = int(time.time())
TEST_EMAIL = f"ai_test_{timestamp}@jobos.ai"
TEST_PASSWORD = "SecurePass123!"
TEST_NAME = "Senior QA Automation Engineer"

# Global variables
token = None
user_id = None
job_id = None

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
# 1. REGISTER FRESH USER
# ============================================================================
def test_register():
    global token, user_id
    print_test("Step 1: Register Fresh User")
    try:
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            user_id = data.get("user", {}).get("id")
            print_success(f"User registered: {TEST_EMAIL}")
            print_info(f"User ID: {user_id}")
            print_info(f"Token: {token[:30]}...")
            return True
        else:
            print_error(f"Registration failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Registration exception: {str(e)}")
        return False

# ============================================================================
# 2. UPDATE PROFILE WITH SKILLS AND RESUME
# ============================================================================
def test_update_profile():
    print_test("Step 2: Update Profile with Skills and Resume")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "skills": ["Playwright", "TypeScript", "SQL", "API Testing"],
            "resume_text": "Senior QA automation engineer with 5+ years experience building Playwright + TypeScript test frameworks, CI/CD pipelines, and API testing suites."
        }
        response = requests.patch(f"{BASE_URL}/profile", json=payload, headers=headers, timeout=10)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            skills = user.get("skills", [])
            resume = user.get("resume_text", "")
            
            print_info(f"Skills: {skills}")
            print_info(f"Resume length: {len(resume)} chars")
            
            if "Playwright" in skills and "TypeScript" in skills:
                print_success("Profile updated successfully")
                return True
            else:
                print_error("Skills not updated correctly")
                return False
        else:
            print_error(f"Profile update failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Profile update exception: {str(e)}")
        return False

# ============================================================================
# 3. GET MODELS LIST
# ============================================================================
def test_get_models():
    print_test("Step 3: GET /api/models - Verify Available Models")
    try:
        response = requests.get(f"{BASE_URL}/models", timeout=10)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            models = data.get("models", [])
            default_model = data.get("default")
            
            print_info(f"Found {len(models)} models")
            print_info(f"Default model: {default_model}")
            
            # Check for gemini and openrouter providers
            gemini_models = [m for m in models if m.get("provider") == "gemini"]
            openrouter_models = [m for m in models if m.get("provider") == "openrouter"]
            
            print_info(f"\nGemini models ({len(gemini_models)}):")
            for m in gemini_models:
                print_info(f"  - {m.get('id')}: {m.get('label')}")
            
            print_info(f"\nOpenRouter models ({len(openrouter_models)}):")
            for m in openrouter_models:
                print_info(f"  - {m.get('id')}: {m.get('label')}")
            
            if len(gemini_models) > 0 and len(openrouter_models) > 0:
                print_success("Both gemini and openrouter providers present")
                return True
            else:
                print_error(f"Missing providers - gemini: {len(gemini_models)}, openrouter: {len(openrouter_models)}")
                return False
        else:
            print_error(f"Models endpoint failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Models endpoint exception: {str(e)}")
        return False

# ============================================================================
# 4. GET JOBS AND PICK SENIOR QA AUTOMATION ENGINEER
# ============================================================================
def test_get_jobs():
    global job_id
    print_test("Step 4: GET /api/jobs - Pick Senior QA Automation Engineer")
    try:
        response = requests.get(f"{BASE_URL}/jobs", timeout=10)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            jobs = data.get("jobs", [])
            print_info(f"Found {len(jobs)} jobs")
            
            # Look for Senior QA Automation Engineer
            for job in jobs:
                title = job.get("title", "")
                if "Senior QA" in title or "QA Automation" in title:
                    job_id = job.get("id")
                    print_success(f"Selected job: {title} at {job.get('company')}")
                    print_info(f"Job ID: {job_id}")
                    return True
            
            # Fallback to any QA job
            for job in jobs:
                title = job.get("title", "")
                if "QA" in title or "Test" in title:
                    job_id = job.get("id")
                    print_success(f"Selected job: {title} at {job.get('company')}")
                    print_info(f"Job ID: {job_id}")
                    return True
            
            # Last resort - pick first job
            if len(jobs) > 0:
                job_id = jobs[0].get("id")
                print_success(f"Selected first job: {jobs[0].get('title')} at {jobs[0].get('company')}")
                print_info(f"Job ID: {job_id}")
                return True
            
            print_error("No jobs found")
            return False
        else:
            print_error(f"Jobs endpoint failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Jobs endpoint exception: {str(e)}")
        return False

# ============================================================================
# 5. AI MATCH - GEMINI 2.5 PRO
# ============================================================================
def test_ai_match_gemini_pro():
    print_test("Step 5: POST /api/ai/match - gemini-2.5-pro")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "jobId": job_id,
            "modelId": "gemini-2.5-pro"
        }
        print_info(f"Testing with job ID: {job_id}")
        print_info("Timeout: 60 seconds...")
        
        response = requests.post(f"{BASE_URL}/ai/match", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            match = data.get("match", {})
            job = data.get("job", {})
            
            # Validate response shape
            required_fields = ["match_percent", "matched_skills", "missing_skills", 
                             "strengths", "gaps", "recommendation", "verdict"]
            missing = [f for f in required_fields if f not in match]
            
            if missing:
                print_error(f"Missing fields: {missing}")
                print_info(f"Response: {json.dumps(match, indent=2)}")
                return False
            
            match_percent = match.get("match_percent")
            verdict = match.get("verdict")
            
            print_info(f"Match Percent: {match_percent}%")
            print_info(f"Verdict: {verdict}")
            print_info(f"Matched Skills: {match.get('matched_skills')}")
            print_info(f"Missing Skills: {match.get('missing_skills')}")
            print_info(f"Strengths: {match.get('strengths')}")
            print_info(f"Gaps: {match.get('gaps')}")
            print_info(f"Recommendation: {match.get('recommendation')}")
            
            # Validate types
            if not isinstance(match_percent, (int, float)):
                print_error(f"match_percent is not a number: {type(match_percent)}")
                return False
            
            if not (0 <= match_percent <= 100):
                print_error(f"match_percent out of range: {match_percent}")
                return False
            
            valid_verdicts = ["Strong Match", "Good Match", "Fair Match", "Weak Match"]
            if verdict not in valid_verdicts:
                print_error(f"Invalid verdict: {verdict}")
                return False
            
            print_success("AI Match (gemini-2.5-pro) successful")
            return True
        else:
            print_error(f"AI Match failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"AI Match exception: {str(e)}")
        return False

# ============================================================================
# 6. AI MATCH - GEMINI FLASH LATEST
# ============================================================================
def test_ai_match_gemini_flash():
    print_test("Step 6: POST /api/ai/match - gemini-flash-latest")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "jobId": job_id,
            "modelId": "gemini-flash-latest"
        }
        print_info(f"Testing with job ID: {job_id}")
        print_info("Timeout: 60 seconds...")
        
        response = requests.post(f"{BASE_URL}/ai/match", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            match = data.get("match", {})
            
            match_percent = match.get("match_percent")
            verdict = match.get("verdict")
            
            print_info(f"Match Percent: {match_percent}%")
            print_info(f"Verdict: {verdict}")
            
            if isinstance(match_percent, (int, float)) and 0 <= match_percent <= 100:
                print_success("AI Match (gemini-flash-latest) successful")
                return True
            else:
                print_error(f"Invalid match_percent: {match_percent}")
                return False
        else:
            print_error(f"AI Match failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"AI Match exception: {str(e)}")
        return False

# ============================================================================
# 7. AI MATCH - OPENAI GPT-4O-MINI
# ============================================================================
def test_ai_match_openai():
    print_test("Step 7: POST /api/ai/match - openai/gpt-4o-mini (OpenRouter)")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "jobId": job_id,
            "modelId": "openai/gpt-4o-mini"
        }
        print_info(f"Testing with job ID: {job_id}")
        print_info("Timeout: 60 seconds...")
        
        response = requests.post(f"{BASE_URL}/ai/match", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            match = data.get("match", {})
            
            match_percent = match.get("match_percent")
            verdict = match.get("verdict")
            
            print_info(f"Match Percent: {match_percent}%")
            print_info(f"Verdict: {verdict}")
            
            if isinstance(match_percent, (int, float)) and 0 <= match_percent <= 100:
                print_success("AI Match (openai/gpt-4o-mini) successful")
                return True
            else:
                print_error(f"Invalid match_percent: {match_percent}")
                return False
        else:
            print_error(f"AI Match failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"AI Match exception: {str(e)}")
        return False

# ============================================================================
# 8. AI MATCH - ANTHROPIC CLAUDE 3.5 SONNET
# ============================================================================
def test_ai_match_claude():
    print_test("Step 8: POST /api/ai/match - anthropic/claude-3.5-sonnet (OpenRouter)")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "jobId": job_id,
            "modelId": "anthropic/claude-3.5-sonnet"
        }
        print_info(f"Testing with job ID: {job_id}")
        print_info("Timeout: 60 seconds...")
        
        response = requests.post(f"{BASE_URL}/ai/match", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            match = data.get("match", {})
            
            match_percent = match.get("match_percent")
            verdict = match.get("verdict")
            
            print_info(f"Match Percent: {match_percent}%")
            print_info(f"Verdict: {verdict}")
            
            if isinstance(match_percent, (int, float)) and 0 <= match_percent <= 100:
                print_success("AI Match (anthropic/claude-3.5-sonnet) successful")
                return True
            else:
                print_error(f"Invalid match_percent: {match_percent}")
                return False
        else:
            print_error(f"AI Match failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"AI Match exception: {str(e)}")
        return False

# ============================================================================
# 9. AI COVER LETTER - GEMINI 2.5 PRO
# ============================================================================
def test_ai_cover_letter_gemini():
    print_test("Step 9: POST /api/ai/cover-letter - gemini-2.5-pro")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "jobId": job_id,
            "modelId": "gemini-2.5-pro"
        }
        print_info(f"Testing with job ID: {job_id}")
        print_info("Timeout: 60 seconds...")
        
        response = requests.post(f"{BASE_URL}/ai/cover-letter", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            cover_letter = data.get("cover_letter", "")
            
            print_info(f"Cover letter length: {len(cover_letter)} chars")
            print_info(f"Preview: {cover_letter[:200]}...")
            
            if cover_letter and len(cover_letter) > 50:
                print_success("AI Cover Letter (gemini-2.5-pro) successful")
                return True
            else:
                print_error(f"Cover letter too short or empty: {len(cover_letter)} chars")
                return False
        else:
            print_error(f"AI Cover Letter failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"AI Cover Letter exception: {str(e)}")
        return False

# ============================================================================
# 10. AI COVER LETTER - OPENAI GPT-4O-MINI
# ============================================================================
def test_ai_cover_letter_openai():
    print_test("Step 10: POST /api/ai/cover-letter - openai/gpt-4o-mini (OpenRouter)")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "jobId": job_id,
            "modelId": "openai/gpt-4o-mini"
        }
        print_info(f"Testing with job ID: {job_id}")
        print_info("Timeout: 60 seconds...")
        
        response = requests.post(f"{BASE_URL}/ai/cover-letter", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            cover_letter = data.get("cover_letter", "")
            
            print_info(f"Cover letter length: {len(cover_letter)} chars")
            print_info(f"Preview: {cover_letter[:200]}...")
            
            if cover_letter and len(cover_letter) > 50:
                print_success("AI Cover Letter (openai/gpt-4o-mini) successful")
                return True
            else:
                print_error(f"Cover letter too short or empty: {len(cover_letter)} chars")
                return False
        else:
            print_error(f"AI Cover Letter failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"AI Cover Letter exception: {str(e)}")
        return False

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================
def main():
    print("\n" + "="*80)
    print("JobOS AI - AI Endpoints Test Suite")
    print("Testing Gemini + OpenRouter API Integration")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Email: {TEST_EMAIL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("="*80)
    
    results = {}
    
    # Run all tests in sequence
    tests = [
        ("1. Register User", test_register),
        ("2. Update Profile", test_update_profile),
        ("3. Get Models", test_get_models),
        ("4. Get Jobs", test_get_jobs),
        ("5. AI Match - gemini-2.5-pro", test_ai_match_gemini_pro),
        ("6. AI Match - gemini-flash-latest", test_ai_match_gemini_flash),
        ("7. AI Match - openai/gpt-4o-mini", test_ai_match_openai),
        ("8. AI Match - anthropic/claude-3.5-sonnet", test_ai_match_claude),
        ("9. AI Cover Letter - gemini-2.5-pro", test_ai_cover_letter_gemini),
        ("10. AI Cover Letter - openai/gpt-4o-mini", test_ai_cover_letter_openai),
    ]
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print_error(f"Test '{test_name}' crashed: {str(e)}")
            results[test_name] = False
        
        # Small delay between tests
        time.sleep(1)
    
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
    
    # Detailed model results
    print("\n" + "="*80)
    print("MODEL-SPECIFIC RESULTS")
    print("="*80)
    
    model_tests = {
        "gemini-2.5-pro (Match)": results.get("5. AI Match - gemini-2.5-pro"),
        "gemini-flash-latest (Match)": results.get("6. AI Match - gemini-flash-latest"),
        "openai/gpt-4o-mini (Match)": results.get("7. AI Match - openai/gpt-4o-mini"),
        "anthropic/claude-3.5-sonnet (Match)": results.get("8. AI Match - anthropic/claude-3.5-sonnet"),
        "gemini-2.5-pro (Cover Letter)": results.get("9. AI Cover Letter - gemini-2.5-pro"),
        "openai/gpt-4o-mini (Cover Letter)": results.get("10. AI Cover Letter - openai/gpt-4o-mini"),
    }
    
    for model, result in model_tests.items():
        status = "✅ WORKING" if result else "❌ FAILED"
        print(f"{status}: {model}")
    
    print("="*80)
    
    if failed == 0:
        print("\n🎉 ALL AI ENDPOINTS WORKING!")
        return 0
    else:
        print(f"\n⚠️  {failed} TEST(S) FAILED")
        return 1

if __name__ == "__main__":
    exit(main())
