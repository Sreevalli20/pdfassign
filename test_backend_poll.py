import requests
import time

assessment_id = "2119f051-c243-49fd-b23e-b1cf623e0e65"
url = f"https://pdfassign.onrender.com/api/assessment/{assessment_id}"

print(f"Polling for assessment {assessment_id}...")

max_attempts = 30
for attempt in range(max_attempts):
    try:
        response = requests.get(url, timeout=30)
        print(f"Attempt {attempt + 1}: Status {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            status = result.get('status')
            print(f"Current status: {status}")
            
            if status == 'completed':
                print("\n=== ASSESSMENT COMPLETED ===")
                print(f"Assessment ID: {result.get('id')}")
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
                pdf_url = f"https://pdfassign.onrender.com/api/assessment/{assessment_id}/answer-sheet"
                print(f"\nTesting PDF endpoint: {pdf_url}")
                pdf_response = requests.get(pdf_url, timeout=30)
                print(f"PDF endpoint status: {pdf_response.status_code}")
                if pdf_response.status_code == 200:
                    print(f"PDF content-type: {pdf_response.headers.get('content-type')}")
                    print(f"PDF size: {len(pdf_response.content)} bytes")
                
                break
            elif status == 'failed':
                print(f"Assessment failed: {result.get('error')}")
                break
            else:
                time.sleep(2)
        else:
            print(f"Error: {response.text}")
            break
    except Exception as e:
        print(f"Exception: {e}")
        time.sleep(2)
