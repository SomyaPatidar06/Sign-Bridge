import requests
import random
import time

API_URL = "http://localhost:8000/api"

def generate_motion_vector():
    # 30 frames * 21 landmarks * 3 coords = 1890
    # Use random noise to ensure it's not a zero vector
    return [random.uniform(0.1, 0.9) for _ in range(1890)]

def test_flow():
    print("1. Generating Vector...")
    vector = generate_motion_vector()
    
    # 2. Save
    print("2. Saving 'TestWave'...")
    res = requests.post(f"{API_URL}/save_sign", json={
        "label": "TestWave",
        "landmarks": vector
    })
    print(f"Save Response: {res.status_code} {res.text}")
    
    # 3. Predict (Same Vector)
    print("3. Predicting 'TestWave' (Exact Match)...")
    res = requests.post(f"{API_URL}/predict_sign", json={
        "landmarks": vector
    })
    print(f"Predict Response: {res.json()}")

if __name__ == "__main__":
    try:
        test_flow()
    except Exception as e:
        print(f"Test Failed: {e}")
