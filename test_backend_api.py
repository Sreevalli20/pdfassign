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
    print("Sending request to backend...")
    response = requests.post(url, files=files, data=data, timeout=120)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Assessment ID: {result.get('id')}")
        print(f"Status: {result.get('status')}")
        print(f"Questions extracted: {len(result.get('questions', []))}")
        print(f"Total pages: {result.get('total_pages')}")
        
        # Print first few questions
        questions = result.get('questions', [])
        for i, q in enumerate(questions[:5]):
            print(f"Q{i+1}: {q['question']['number']} - {q['question']['text'][:50]}...")
            print(f"  Status: {q['status']}")
            if q.get('answer'):
                print(f"  Answer: {q['answer']['label']}")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Exception: {e}")
finally:
    files['question_paper'].close()
    files['answer_sheet'].close()
