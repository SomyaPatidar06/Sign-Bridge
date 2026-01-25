from qdrant_utils import init_qdrant, save_sign, client, COLLECTION_NAME, VECTOR_SIZE
import random
import sys

sys.stdout.reconfigure(line_buffering=True)

def test():
    print("1. Init...")
    init_qdrant()
    
    vec = [random.uniform(0.1, 0.9) for _ in range(VECTOR_SIZE)]
    print("2. Saving...")
    save_sign("TestQuery", vec)
    
    print("3. Querying...")
    try:
        # Use query_points which exists
        response = client.query_points(
            collection_name=COLLECTION_NAME,
            query=vec,
            limit=5,
            with_payload=True
        )
        print(f"   Response Type: {type(response)}")
        print(f"   Response Points: {response.points}")
    except Exception as e:
        print(f"   Query Failed: {e}")

if __name__ == "__main__":
    test()
