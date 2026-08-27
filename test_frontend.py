import requests

# Test production frontend
frontend_url = "https://assign-f5p4.vercel.app"

print(f"Testing production frontend: {frontend_url}")
try:
    response = requests.get(frontend_url, timeout=10)
    print(f"Frontend status: {response.status_code}")
    print(f"Response length: {len(response.text)} characters")
    
    # Check if it contains expected content
    if "VedaAI" in response.text:
        print("[OK] Frontend contains VedaAI branding")
    else:
        print("[FAIL] Frontend missing VedaAI branding")
        
    if "Question Paper" in response.text or "Student Answer Sheet" in response.text:
        print("[OK] Frontend contains upload UI")
    else:
        print("[FAIL] Frontend missing upload UI")
        
except Exception as e:
    print(f"Frontend test failed: {e}")

# Test backend health
backend_url = "https://pdfassign.onrender.com/api/health"
print(f"\nTesting production backend: {backend_url}")
try:
    response = requests.get(backend_url, timeout=10)
    print(f"Backend health status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Backend health check failed: {e}")

print("\n[OK] Production deployment verification complete")
print(f"Frontend URL: {frontend_url}")
print(f"Backend URL: https://pdfassign.onrender.com")
