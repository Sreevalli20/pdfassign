import requests
import os

# Test files
qp_path = r"d:\assign\backend\temp\uploads\0bae07ea-c9bd-49eb-8fe4-bcb9c4979f9c_qp.pdf"
as_path = r"d:\assign\backend\temp\uploads\0bae07ea-c9bd-49eb-8fe4-bcb9c4979f9c_as.pdf"

url = "https://pdfassign.onrender.com/api/assessment/process"

# Check if files exist
if not os.path.exists(qp_path):
    print(f"Question paper not found: {qp_path}")
    exit(1)
if not os.path.exists(as_path):
    print(f"Answer sheet not found: {as_path}")
    exit(1)

# Prepare files
files = {
    'question_paper': open(qp_path, 'rb'),
    'answer_sheet': open(as_path, 'rb')
}

data = {
    'demo_mode': 'false'
}

try:
    print("Sending request to backend (synchronous processing)...")
    print("This may take up to 60 seconds...")
    response = requests.post(url, files=files, data=data, timeout=120)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n=== ASSESSMENT RESULT ===")
        print(f"Assessment ID: {result.get('id')}")
        print(f"Status: {result.get('status')}")
        
        if result.get('error'):
            print(f"Error: {result.get('error')}")
        
        print(f"Questions extracted: {len(result.get('questions', []))}")
        print(f"Total pages: {result.get('total_pages')}")
        print(f"Unmatched answers: {len(result.get('unmatched_answers', []))}")
        
        questions = result.get('questions', [])
        print(f"\n--- First 10 Questions ---")
        for i, q in enumerate(questions[:10]):
            print(f"Q{i+1}: {q['question']['number']} - {q['question']['text'][:60]}...")
            print(f"  Status: {q['status']}")
            if q.get('mapping'):
                print(f"  Mapping confidence: {q['mapping']['confidence']}")
            if q.get('answer'):
                print(f"  Answer label: {q['answer']['label']}")
        
        answered = sum(1 for q in questions if q['status'] == 'answered')
        unanswered = sum(1 for q in questions if q['status'] == 'unanswered')
        needs_review = sum(1 for q in questions if q['status'] == 'needs_review')
        
        print(f"\n--- Summary ---")
        print(f"Answered: {answered}")
        print(f"Unanswered: {unanswered}")
        print(f"Needs Review: {needs_review}")
        
        # Test PDF endpoint
        assessment_id = result.get('id')
        pdf_url = f"https://pdfassign.onrender.com/api/assessment/{assessment_id}/answer-sheet"
        print(f"\nTesting PDF endpoint: {pdf_url}")
        pdf_response = requests.get(pdf_url, timeout=30)
        print(f"PDF endpoint status: {pdf_response.status_code}")
        if pdf_response.status_code == 200:
            print(f"PDF content-type: {pdf_response.headers.get('content-type')}")
            print(f"PDF size: {len(pdf_response.content)} bytes")
    else:
        print(f"Error: {response.text}")
        
except requests.exceptions.Timeout:
    print("Request timed out - processing may be taking too long on Render")
except Exception as e:
    print(f"Exception: {e}")
finally:
    files['question_paper'].close()
    files['answer_sheet'].close()
