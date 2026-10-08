from fastapi.testclient import TestClient
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.api.main import app

# Using TestClient to test the API directly without needing to expose/bind ports
client = TestClient(app)

print("\n=============================")
print("--- Testing GET /health ---")
response = client.get("/health")
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")

print("\n=============================")
print("--- Testing GET /insights ---")
response = client.get("/insights")
print(f"Status Code: {response.status_code}")
insights = response.json().get('insights', [])
print(f"Retrieved {len(insights)} business insights.")
if len(insights) > 0:
    print(f"Sample: {insights[0]}")

print("\n=============================")
print("--- Testing POST /recommend ---")
response = client.post("/recommend", json={"query": "What are the rules for profit margins?"})
print(f"Status Code: {response.status_code}")
print(f"Recommendation Output: \n{response.json().get('recommendation')}")

print("\n=============================")
print("--- Testing POST /forecast ---")
response = client.post("/forecast", json={"horizon": 3})
print(f"Status Code: {response.status_code}")
forecasts = response.json().get('forecast', [])
print(f"Generated {len(forecasts)} forecast rows.")
if len(forecasts) > 0:
    print(f"Sample Forecast Row: {forecasts[0]}")
