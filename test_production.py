import requests
import time

# Test production backend health
health_url = "https://pdfassign.onrender.com/api/health"

print("Testing production backend health...")
try:
    response = requests.get(health_url, timeout=10)
    print(f"Health check status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Health check failed: {e}")

# Test with the real PDF files
question_paper_path = r"C:\Users\Sreevalli\Downloads\13492468-Module2_Assignments.pdf"
answer_sheet_path = r"C:\Users\Sreevalli\Downloads\Linux_System_Administration_Assignment.pdf"

import os

if not os.path.exists(question_paper_path):
    print(f"Question paper not found: {question_paper_path}")
    exit(1)

if not os.path.exists(answer_sheet_path):
    print(f"Answer sheet not found: {answer_sheet_path}")
    exit(1)

# Prepare files
files = {
    'question_paper': open(question_paper_path, 'rb'),
    'answer_sheet': open(answer_sheet_path, 'rb')
}

data = {
    'demo_mode': 'false'
}

try:
    print(f"\nSending POST request to production backend...")
    print(f"Question paper: {os.path.basename(question_paper_path)}")
    print(f"Answer sheet: {os.path.basename(answer_sheet_path)}")
    
    response = requests.post("https://pdfassign.onrender.com/api/assessment/process", files=files, data=data, timeout=30)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        assessment_id = result['id']
        print(f"\nAssessment ID: {assessment_id}")
        print(f"Initial status: {result['status']}")
        
        # Poll for completion
        print(f"\nPolling for completion...")
        for i in range(30):
            time.sleep(3)
            poll_response = requests.get(f"https://pdfassign.onrender.com/api/assessment/{assessment_id}")
            print(f"Attempt {i+1}: Status {poll_response.status_code}")
            
            if poll_response.status_code == 200:
                poll_result = poll_response.json()
                print(f"Current status: {poll_result['status']}")
                
                if poll_result['status'] in ['completed', 'failed']:
                    print(f"\nFinal result:")
                    print(f"Status: {poll_result['status']}")
                    print(f"Questions: {len(poll_result['questions'])}")
                    print(f"Unmatched answers: {len(poll_result['unmatched_answers'])}")
                    print(f"Total pages: {poll_result['total_pages']}")
                    
                    if poll_result['status'] == 'failed' and poll_result.get('error'):
                        print(f"Error: {poll_result['error']}")
                    
                    # Print first few questions
                    if poll_result['questions']:
                        print(f"\nFirst 5 questions:")
                        for q in poll_result['questions'][:5]:
                            status = q['status']
                            has_answer = q.get('answer') is not None
                            print(f"  - {q['question']['number']}: {q['question']['text'][:50]}... [{status}] {'[HAS ANSWER]' if has_answer else '[NO ANSWER]'}")
                    
                    break
        else:
            print("Polling timed out")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    files['question_paper'].close()
    files['answer_sheet'].close()
