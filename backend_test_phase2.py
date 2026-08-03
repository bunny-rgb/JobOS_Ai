#!/usr/bin/env python3
"""
JobOS AI Backend API - Phase 2 Test Suite
Tests Google OAuth and AI Interview Coach endpoints
"""

import requests
import json
import time
from datetime import datetime

# Load base URL from .env
BASE_URL = "https://26f7e9d2-a7c5-4a81-a4a6-e725fa407223.preview.emergentagent.com/api"

# Test data
timestamp = int(time.time())
TEST_EMAIL = f"qa_interview_test_{timestamp}@jobos.ai"
TEST_PASSWORD = "SecurePass123!"
TEST_NAME = "Sarah Martinez"

# Global variables to store state
token = None
user_id = None
session_id = None

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
# A) GOOGLE OAUTH - NEGATIVE PATHS
# ============================================================================

def test_google_oauth_invalid_credential():
    """Test POST /api/auth/google with invalid credential -> expect 401"""
    print_test("Google OAuth - Invalid Credential (expect 401)")
    try:
        payload = {"credential": "not-a-real-google-token"}
        response = requests.post(f"{BASE_URL}/auth/google", json=payload, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 401:
            data = response.json()
            if "error" in data:
                print_success(f"Invalid credential correctly rejected with 401: {data['error']}")
                return True
            else:
                print_error("401 response missing 'error' field")
                return False
        else:
            print_error(f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def test_google_oauth_missing_credential():
    """Test POST /api/auth/google with no body -> expect 400"""
    print_test("Google OAuth - Missing Credential (expect 400)")
    try:
        # Test with empty body
        response = requests.post(f"{BASE_URL}/auth/google", json={}, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 400:
            data = response.json()
            if "error" in data:
                print_success(f"Missing credential correctly rejected with 400: {data['error']}")
                return True
            else:
                print_error("400 response missing 'error' field")
                return False
        else:
            print_error(f"Expected 400, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def test_google_oauth_null_credential():
    """Test POST /api/auth/google with null credential -> expect 400"""
    print_test("Google OAuth - Null Credential (expect 400)")
    try:
        payload = {"credential": None}
        response = requests.post(f"{BASE_URL}/auth/google", json=payload, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 400:
            data = response.json()
            if "error" in data:
                print_success(f"Null credential correctly rejected with 400: {data['error']}")
                return True
            else:
                print_error("400 response missing 'error' field")
                return False
        else:
            print_error(f"Expected 400, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

# ============================================================================
# B) AI INTERVIEW COACH - SETUP
# ============================================================================

def test_register_user():
    """Register a fresh user for interview testing"""
    global token, user_id
    print_test("Register User for Interview Testing")
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
            if "token" in data and "user" in data:
                token = data["token"]
                user_id = data["user"].get("id")
                print_success(f"User registered successfully. ID: {user_id}")
                return True
            else:
                print_error("Missing token or user in response")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Registration failed: {str(e)}")
        return False

def test_update_profile():
    """Update profile with QA skills and resume"""
    print_test("Update Profile with QA Skills")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "skills": ["Manual Testing", "JIRA", "SQL", "API Testing"],
            "title": "QA Engineer",
            "resume_text": "3 years manual testing at fintech. Wrote test plans in JIRA, executed regression cycles, and did API testing in Postman."
        }
        response = requests.patch(f"{BASE_URL}/profile", json=payload, headers=headers, timeout=10)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            if user.get("title") == "QA Engineer" and "Manual Testing" in user.get("skills", []):
                print_success("Profile updated successfully")
                return True
            else:
                print_error("Profile data mismatch")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Profile update failed: {str(e)}")
        return False

# ============================================================================
# B) AI INTERVIEW COACH - ROUNDS
# ============================================================================

def test_interview_rounds():
    """Test GET /api/interview/rounds -> expect 6 rounds"""
    print_test("Interview Rounds - GET /api/interview/rounds")
    try:
        response = requests.get(f"{BASE_URL}/interview/rounds", timeout=10)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            rounds = data.get("rounds", [])
            print_info(f"Found {len(rounds)} rounds")
            
            if len(rounds) != 6:
                print_error(f"Expected 6 rounds, got {len(rounds)}")
                return False
            
            # Verify required round IDs
            expected_ids = ['qa', 'sql', 'hr', 'behavioral', 'system_design', 'manager']
            actual_ids = [r.get('id') for r in rounds]
            
            missing_ids = [rid for rid in expected_ids if rid not in actual_ids]
            if missing_ids:
                print_error(f"Missing round IDs: {missing_ids}")
                return False
            
            # Verify each round has required fields
            for r in rounds:
                if not all(k in r for k in ['id', 'label', 'desc']):
                    print_error(f"Round missing required fields: {r}")
                    return False
            
            print_info(f"Round IDs: {actual_ids}")
            print_success("All 6 rounds returned with correct structure")
            return True
        else:
            print_error(f"Expected 200, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

# ============================================================================
# B) AI INTERVIEW COACH - QA ROUND WITH GEMINI
# ============================================================================

def test_interview_start_qa_gemini():
    """Test POST /api/interview/start with QA round and gemini-flash-latest"""
    global session_id
    print_test("Interview Start - QA Round with gemini-flash-latest")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "round": "qa",
            "modelId": "gemini-flash-latest",
            "total": 3
        }
        print_info("Starting QA interview session (may take 10-30 seconds)...")
        response = requests.post(f"{BASE_URL}/interview/start", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            session = data.get("session", {})
            current_question = data.get("currentQuestion", {})
            
            # Validate session structure
            if not session.get("id"):
                print_error("Missing session.id")
                return False
            
            session_id = session.get("id")
            
            if session.get("total") != 3:
                print_error(f"Expected total=3, got {session.get('total')}")
                return False
            
            if not isinstance(session.get("turns"), list) or len(session.get("turns")) != 1:
                print_error(f"Expected turns array with 1 item, got {session.get('turns')}")
                return False
            
            # Validate currentQuestion
            if not current_question.get("question") or not isinstance(current_question.get("question"), str):
                print_error(f"Missing or invalid currentQuestion.question: {current_question}")
                return False
            
            print_info(f"Session ID: {session_id}")
            print_info(f"First Question: {current_question.get('question')[:100]}...")
            print_success("Interview session started successfully with first question")
            return True
        else:
            print_error(f"Expected 200, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def test_interview_answer_1():
    """Test POST /api/interview/answer - First answer"""
    print_test("Interview Answer 1 - QA Round")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "sessionId": session_id,
            "answer": "A test case would include a title, preconditions, steps, test data, expected result and actual result. For a login page I would design cases for valid login, invalid password, empty fields, SQL injection, and lockout after N failed attempts."
        }
        print_info("Submitting answer 1 (may take 10-30 seconds)...")
        response = requests.post(f"{BASE_URL}/interview/answer", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            evaluation = data.get("evaluation", {})
            next_question = data.get("nextQuestion")
            progress = data.get("progress", {})
            done = data.get("done")
            
            # Validate evaluation
            score = evaluation.get("score")
            if not isinstance(score, (int, float)) or not (0 <= score <= 10):
                print_error(f"Invalid evaluation.score: {score} (expected 0-10)")
                return False
            
            feedback = evaluation.get("feedback")
            if not feedback or not isinstance(feedback, str):
                print_error(f"Missing or invalid evaluation.feedback: {feedback}")
                return False
            
            # Validate nextQuestion (should be present since we're not done)
            if not next_question or not next_question.get("question"):
                print_error(f"Missing nextQuestion: {next_question}")
                return False
            
            # Validate progress
            if progress.get("answered") != 1 or progress.get("total") != 3:
                print_error(f"Invalid progress: {progress} (expected answered=1, total=3)")
                return False
            
            # Validate done flag
            if done != False:
                print_error(f"Expected done=False, got {done}")
                return False
            
            print_info(f"Score: {score}/10")
            print_info(f"Feedback: {feedback[:100]}...")
            print_info(f"Next Question: {next_question.get('question')[:100]}...")
            print_success("Answer 1 evaluated successfully with next question")
            return True
        else:
            print_error(f"Expected 200, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def test_interview_answer_2():
    """Test POST /api/interview/answer - Second answer"""
    print_test("Interview Answer 2 - QA Round")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "sessionId": session_id,
            "answer": "In my previous role, I found a critical bug where the payment gateway was charging customers twice during peak hours. I reproduced it by simulating high load, documented the steps with screenshots, assigned it P0 priority in JIRA, and worked with the dev team to verify the fix in staging before production deployment."
        }
        print_info("Submitting answer 2 (may take 10-30 seconds)...")
        response = requests.post(f"{BASE_URL}/interview/answer", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            evaluation = data.get("evaluation", {})
            next_question = data.get("nextQuestion")
            progress = data.get("progress", {})
            done = data.get("done")
            
            # Validate evaluation
            score = evaluation.get("score")
            if not isinstance(score, (int, float)) or not (0 <= score <= 10):
                print_error(f"Invalid evaluation.score: {score}")
                return False
            
            # Validate progress
            if progress.get("answered") != 2 or progress.get("total") != 3:
                print_error(f"Invalid progress: {progress} (expected answered=2, total=3)")
                return False
            
            # Validate done flag
            if done != False:
                print_error(f"Expected done=False, got {done}")
                return False
            
            print_info(f"Score: {score}/10")
            print_info(f"Progress: {progress.get('answered')}/{progress.get('total')}")
            print_success("Answer 2 evaluated successfully")
            return True
        else:
            print_error(f"Expected 200, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def test_interview_answer_3_final():
    """Test POST /api/interview/answer - Third and final answer with report"""
    print_test("Interview Answer 3 - Final with Report")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "sessionId": session_id,
            "answer": "I use a risk-based approach to prioritize testing. First, I identify critical user flows like login, checkout, and data submission. Then I assess the impact and likelihood of failure for each feature. High-risk areas get thorough testing including edge cases, while low-risk features get smoke testing. I also consider recent code changes and areas with historical bugs."
        }
        print_info("Submitting final answer (may take 10-30 seconds)...")
        response = requests.post(f"{BASE_URL}/interview/answer", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            evaluation = data.get("evaluation", {})
            next_question = data.get("nextQuestion")
            progress = data.get("progress", {})
            done = data.get("done")
            report = data.get("report", {})
            
            # Validate evaluation
            score = evaluation.get("score")
            if not isinstance(score, (int, float)) or not (0 <= score <= 10):
                print_error(f"Invalid evaluation.score: {score}")
                return False
            
            # Validate progress
            if progress.get("answered") != 3 or progress.get("total") != 3:
                print_error(f"Invalid progress: {progress} (expected answered=3, total=3)")
                return False
            
            # Validate done flag
            if done != True:
                print_error(f"Expected done=True, got {done}")
                return False
            
            # Validate nextQuestion should be null
            if next_question is not None:
                print_error(f"Expected nextQuestion=null, got {next_question}")
                return False
            
            # Validate report structure
            if not report:
                print_error("Missing report in final response")
                return False
            
            overall_score = report.get("overall_score")
            if not isinstance(overall_score, int) or not (0 <= overall_score <= 100):
                print_error(f"Invalid report.overall_score: {overall_score} (expected int 0-100)")
                return False
            
            verdict = report.get("verdict")
            valid_verdicts = ["Excellent", "Strong", "Solid", "Needs Work", "Weak"]
            if verdict not in valid_verdicts:
                print_error(f"Invalid report.verdict: {verdict} (expected one of {valid_verdicts})")
                return False
            
            strengths = report.get("strengths")
            if not isinstance(strengths, list) or len(strengths) == 0:
                print_error(f"Invalid report.strengths: {strengths} (expected non-empty array)")
                return False
            
            weak_areas = report.get("weak_areas")
            if not isinstance(weak_areas, list) or len(weak_areas) == 0:
                print_error(f"Invalid report.weak_areas: {weak_areas} (expected non-empty array)")
                return False
            
            recommendations = report.get("recommendations")
            if not isinstance(recommendations, list) or len(recommendations) == 0:
                print_error(f"Invalid report.recommendations: {recommendations} (expected non-empty array)")
                return False
            
            print_info(f"Overall Score: {overall_score}/100")
            print_info(f"Verdict: {verdict}")
            print_info(f"Strengths: {len(strengths)} items")
            print_info(f"Weak Areas: {len(weak_areas)} items")
            print_info(f"Recommendations: {len(recommendations)} items")
            print_success("Final answer evaluated with complete report")
            return True
        else:
            print_error(f"Expected 200, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

# ============================================================================
# B) AI INTERVIEW COACH - SESSIONS
# ============================================================================

def test_interview_sessions():
    """Test GET /api/interview/sessions -> should contain completed session"""
    print_test("Interview Sessions - GET /api/interview/sessions")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/interview/sessions", headers=headers, timeout=10)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            sessions = data.get("sessions", [])
            
            if len(sessions) < 1:
                print_error("Expected at least 1 session")
                return False
            
            # Find our completed session
            completed_session = None
            for s in sessions:
                if s.get("id") == session_id:
                    completed_session = s
                    break
            
            if not completed_session:
                print_error(f"Could not find session {session_id} in sessions list")
                return False
            
            if completed_session.get("status") != "completed":
                print_error(f"Expected status='completed', got {completed_session.get('status')}")
                return False
            
            if not completed_session.get("report"):
                print_error("Completed session missing report field")
                return False
            
            print_info(f"Found {len(sessions)} session(s)")
            print_info(f"Completed session ID: {completed_session.get('id')}")
            print_success("Sessions retrieved successfully with completed session and report")
            return True
        else:
            print_error(f"Expected 200, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def test_interview_answer_completed_session():
    """Test POST /api/interview/answer with completed session -> expect 400"""
    print_test("Interview Answer - Completed Session (expect 400)")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "sessionId": session_id,
            "answer": "This should fail because the session is already completed"
        }
        response = requests.post(f"{BASE_URL}/interview/answer", json=payload, headers=headers, timeout=10)
        print_info(f"Status: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 400:
            data = response.json()
            if "error" in data:
                print_success(f"Completed session correctly rejected with 400: {data['error']}")
                return True
            else:
                print_error("400 response missing 'error' field")
                return False
        else:
            print_error(f"Expected 400, got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

# ============================================================================
# C) TEST WITH DIFFERENT MODEL - SQL ROUND WITH OPENAI
# ============================================================================

def test_interview_start_sql_openai():
    """Test POST /api/interview/start with SQL round and openai/gpt-4o-mini"""
    global session_id
    print_test("Interview Start - SQL Round with openai/gpt-4o-mini")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "round": "sql",
            "modelId": "openai/gpt-4o-mini",
            "total": 3
        }
        print_info("Starting SQL interview session with OpenAI (may take 10-30 seconds)...")
        response = requests.post(f"{BASE_URL}/interview/start", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            session = data.get("session", {})
            current_question = data.get("currentQuestion", {})
            
            # Validate session structure
            if not session.get("id"):
                print_error("Missing session.id")
                return False
            
            session_id = session.get("id")
            
            if session.get("modelId") != "openai/gpt-4o-mini":
                print_error(f"Expected modelId='openai/gpt-4o-mini', got {session.get('modelId')}")
                return False
            
            if not current_question.get("question"):
                print_error(f"Missing currentQuestion.question")
                return False
            
            print_info(f"Session ID: {session_id}")
            print_info(f"Model: {session.get('modelId')}")
            print_info(f"First Question: {current_question.get('question')[:100]}...")
            print_success("SQL interview session started successfully with OpenAI model")
            return True
        else:
            print_error(f"Expected 200, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def test_interview_answer_sql_openai():
    """Test POST /api/interview/answer for SQL round with OpenAI"""
    print_test("Interview Answer - SQL Round with OpenAI")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "sessionId": session_id,
            "answer": "To find the second highest salary, I would use a subquery: SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees). Alternatively, I could use LIMIT with OFFSET: SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1. For better performance with large datasets, I'd use window functions: SELECT salary FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rank FROM employees) WHERE rank = 2."
        }
        print_info("Submitting SQL answer with OpenAI (may take 10-30 seconds)...")
        response = requests.post(f"{BASE_URL}/interview/answer", json=payload, headers=headers, timeout=60)
        print_info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            evaluation = data.get("evaluation", {})
            next_question = data.get("nextQuestion")
            
            # Validate evaluation
            score = evaluation.get("score")
            if not isinstance(score, (int, float)) or not (0 <= score <= 10):
                print_error(f"Invalid evaluation.score: {score}")
                return False
            
            feedback = evaluation.get("feedback")
            if not feedback or not isinstance(feedback, str):
                print_error(f"Missing or invalid evaluation.feedback")
                return False
            
            # Should have next question since it's only the first answer
            if not next_question or not next_question.get("question"):
                print_error(f"Missing nextQuestion")
                return False
            
            print_info(f"Score: {score}/10")
            print_info(f"Feedback: {feedback[:100]}...")
            print_success("SQL answer evaluated successfully with OpenAI model")
            return True
        else:
            print_error(f"Expected 200, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def main():
    print("\n" + "="*80)
    print("JobOS AI Backend API - Phase 2 Test Suite")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Email: {TEST_EMAIL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("="*80)
    
    results = {}
    
    # Run all tests in sequence
    tests = [
        # A) Google OAuth - Negative Paths
        ("Google OAuth - Invalid Credential", test_google_oauth_invalid_credential),
        ("Google OAuth - Missing Credential", test_google_oauth_missing_credential),
        ("Google OAuth - Null Credential", test_google_oauth_null_credential),
        
        # B) AI Interview Coach - Setup
        ("Register User", test_register_user),
        ("Update Profile", test_update_profile),
        
        # B) AI Interview Coach - Rounds
        ("Interview Rounds", test_interview_rounds),
        
        # B) AI Interview Coach - QA Round with Gemini
        ("Interview Start - QA/Gemini", test_interview_start_qa_gemini),
        ("Interview Answer 1", test_interview_answer_1),
        ("Interview Answer 2", test_interview_answer_2),
        ("Interview Answer 3 - Final", test_interview_answer_3_final),
        ("Interview Sessions", test_interview_sessions),
        ("Interview Answer - Completed Session", test_interview_answer_completed_session),
        
        # C) Test with Different Model - SQL Round with OpenAI
        ("Interview Start - SQL/OpenAI", test_interview_start_sql_openai),
        ("Interview Answer - SQL/OpenAI", test_interview_answer_sql_openai),
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
        print("\n🎉 ALL PHASE 2 TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️  {failed} TEST(S) FAILED")
        return 1

if __name__ == "__main__":
    exit(main())
