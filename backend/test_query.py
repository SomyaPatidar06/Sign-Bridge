from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct

client = QdrantClient(location=":memory:")
COLLECTION_NAME = "test_collection"

client.recreate_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=VectorParams(size=4, distance=Distance.COSINE),
)

client.upsert(
    collection_name=COLLECTION_NAME,
    points=[
        PointStruct(id=1, vector=[0.1, 0.1, 0.1, 0.1], payload={"label": "test"})
    ]
)

try:
    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=[0.1, 0.1, 0.1, 0.1],
        limit=1
    )
    print("Query Points Result:", results)
    print("Type:", type(results))
    if hasattr(results, 'points'):
         print("Points:", results.points)
except Exception as e:
    print("Query Points Error:", e)

try:
    # also try pure query()
    results = client.query(
        collection_name=COLLECTION_NAME,
        query_vector=[0.1, 0.1, 0.1, 0.1],
        limit=1
    )
    print("Query Result:", results)
except Exception as e:
    print("Query Error:", e)
