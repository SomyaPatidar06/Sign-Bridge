import requests
import json

url = "http://127.0.0.1:8000/api/predict_sign"
# Create dummy landmarks (flat list of 63 floats)
landmarks = [0.1] * 63

try:
    response = requests.post(url, json={"landmarks": landmarks})
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
