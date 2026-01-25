from qdrant_client import QdrantClient
client = QdrantClient(location=":memory:")
methods = [m for m in dir(client) if "search" in m or "query" in m]
print(f"Relevant methods: {methods}")
