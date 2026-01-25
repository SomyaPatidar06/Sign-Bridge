from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import uuid

# Initialize Qdrant Client (In-memory for stability)
client = QdrantClient(location=":memory:")

COLLECTION_NAME = "sign_language_gestures"
VECTOR_SIZE = 1890  # 30 Frames * 21 landmarks * 3 coordinates (x, y, z)
BACKUP_FILE = "qdrant_backup.json"

def init_qdrant():
    try:
        collections = client.get_collections()
        exists = COLLECTION_NAME in [c.name for c in collections.collections]
        
        if exists:
            info = client.get_collection(COLLECTION_NAME)
            # Handle both single vector config and multiple named vectors (we use single)
            current_size = info.config.params.vectors.size if hasattr(info.config.params.vectors, 'size') else 0
            
            if current_size != VECTOR_SIZE:
                print(f"Dimension mismatch (Expected {VECTOR_SIZE}, Found {current_size}). Resetting DB...")
                client.delete_collection(COLLECTION_NAME)
                
                # Delete incompatible backup
                import os
                if os.path.exists(BACKUP_FILE):
                    os.remove(BACKUP_FILE)
                    print("Deleted incompatible backup file.")
                exists = False

        if not exists:
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )
            print(f"Collection '{COLLECTION_NAME}' created with dim {VECTOR_SIZE}.")
            # Load from backup if exists (and compatible)
            import_from_json()
        else:
            print(f"Collection '{COLLECTION_NAME}' ready.")
            
    except Exception as e:
        print(f"Error initializing Qdrant: {e}")

def save_sign(label: str, vector: list):
    point_id = str(uuid.uuid4())
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=point_id,
                vector=vector,
                payload={"label": label}
            )
        ]
    )
    # Auto-save to JSON
    export_to_json()
    return point_id

def search_sign(vector: list, limit: int = 1):
    try:
        response = client.query_points(
            collection_name=COLLECTION_NAME,
            query=vector,
            limit=limit,
            with_payload=True
        )
        if response.points:
             match = response.points[0]
             log_msg = f"Top match: {match.payload['label']} ({match.score})\n"
             print(log_msg.strip())
             with open("debug.log", "a") as f:
                 f.write(log_msg)
        else:
             with open("debug.log", "a") as f:
                 f.write("No matches found.\n")
        return response.points
    except Exception as e:
        with open("debug.log", "a") as f:
            f.write(f"Search error: {e}\n")
        print(f"Search error: {e}")
        return []

def reset_collection():
    try:
        # 1. Delete backup FIRST to prevent auto-restore on init
        import os
        if os.path.exists(BACKUP_FILE):
            os.remove(BACKUP_FILE)
            
        # 2. Reset In-Memory DB
        client.delete_collection(collection_name=COLLECTION_NAME)
        init_qdrant() # Now this will create an EMPTY collection
        
        return True
    except Exception as e:
        print(f"Error resetting collection: {e}")
        return False

# Custom JSON Persistence (Bypasses Windows File Locks)
def export_to_json():
    import json
    try:
        # Scroll all points
        points, _ = client.scroll(
            collection_name=COLLECTION_NAME,
            limit=1000,
            with_vectors=True,
            with_payload=True
        )
        data = []
        for p in points:
            data.append({
                "id": p.id,
                "vector": p.vector,
                "payload": p.payload
            })
        
        with open(BACKUP_FILE, "w") as f:
            json.dump(data, f)
        print(f"Backed up {len(data)} signs to {BACKUP_FILE}")
    except Exception as e:
        print(f"Backup failed: {e}")

def import_from_json():
    import json
    import os
    if not os.path.exists(BACKUP_FILE):
        return
    
    try:
        with open(BACKUP_FILE, "r") as f:
            data = json.load(f)
        
        points = []
        for item in data:
            points.append(PointStruct(
                id=item["id"],
                vector=item["vector"],
                payload=item["payload"]
            ))
        
        if points:
            client.upsert(
                collection_name=COLLECTION_NAME,
                points=points
            )
        print(f"Restored {len(points)} signs from {BACKUP_FILE}")
    except Exception as e:
        print(f"Restore failed: {e}")

def get_all_labels():
    try:
        points, _ = client.scroll(
            collection_name=COLLECTION_NAME,
            limit=1000,
            with_payload=True,
            with_vectors=False
        )
        labels = set()
        for p in points:
            if p.payload and "label" in p.payload:
                labels.add(p.payload["label"])
        return list(labels)
    except Exception as e:
        print(f"Error getting labels: {e}")
        return []

def delete_sign_by_label(label: str):
    try:
        client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="label",
                        match=MatchValue(value=label)
                    )
                ]
            )
        )
        # Update backup
        export_to_json()
        return True
    except Exception as e:
        print(f"Error deleting sign '{label}': {e}")
        return False
