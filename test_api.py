import requests
import os

# API endpoint
url = "http://localhost:8006/api/assessment/process"

# File paths
question_paper_path = r"C:\Users\Sreevalli\Downloads\13492468-Module2_Assignments.pdf"
answer_sheet_path = r"C:\Users\Sreevalli\Downloads\Linux_System_Administration_Assignment.pdf"

# Check if files exist
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
    print(f"Sending POST request to {url}")
    print(f"Question paper: {os.path.basename(question_paper_path)}")
    print(f"Answer sheet: {os.path.basename(answer_sheet_path)}")
    
    response = requests.post(url, files=files, data=data)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    files['question_paper'].close()
    files['answer_sheet'].close()
