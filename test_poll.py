import requests
import time

# Use the assessment ID from the previous response
assessment_id = "494dcc30-00de-4592-a5a8-d223958db88a"
url = f"http://localhost:8006/api/assessment/{assessment_id}"

print(f"Polling for assessment {assessment_id}...")

for i in range(30):
    response = requests.get(url)
    print(f"Attempt {i+1}: Status {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Current status: {result['status']}")
        
        if result['status'] in ['completed', 'failed']:
            print(f"\nFinal result:")
            print(f"Status: {result['status']}")
            print(f"Questions: {len(result['questions'])}")
            print(f"Unmatched answers: {len(result['unmatched_answers'])}")
            print(f"Total pages: {result['total_pages']}")
            
            if result['status'] == 'failed' and result.get('error'):
                print(f"Error: {result['error']}")
            
            # Print questions if any
            if result['questions']:
                print(f"\nQuestions found:")
                for q in result['questions']:
                    status = q['status']
                    has_answer = q.get('answer') is not None
                    print(f"  - {q['question']['number']}: {q['question']['text'][:50]}... [{status}] {'[HAS ANSWER]' if has_answer else '[NO ANSWER]'}")
            
            # Print unmatched answers if any
            if result['unmatched_answers']:
                print(f"\nUnmatched answers:")
                for a in result['unmatched_answers']:
                    print(f"  - {a['label']}: {a['text'][:50]}...")
            
            break
    
    time.sleep(2)
else:
    print("Polling timed out")
