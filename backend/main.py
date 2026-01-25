from fastapi import FastAPI, HTTPException
import sys
sys.stdout.reconfigure(line_buffering=True)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models import SignSample, PredictionRequest
from qdrant_utils import init_qdrant, save_sign, search_sign, reset_collection, get_all_labels, delete_sign_by_label
import uvicorn
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_qdrant()

@app.get("/")
def read_root():
    return {"message": "Sign-Bridge API is running"}

@app.post("/save_sign")
def api_save_sign(sample: SignSample):
    try:
        # Save to Qdrant
        point_id = save_sign(sample.label, sample.landmarks)
        return {"status": "success", "id": point_id, "label": sample.label}
    except Exception as e:
        import traceback
        with open("error.log", "a") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict_sign")
def api_predict_sign(request: PredictionRequest):
    try:
        # Debug: Check vector size
        # print(f"DEBUG: Search request len={len(request.landmarks)}")
        
        # Search Qdrant
        results = search_sign(request.landmarks, limit=3) # Inspect top 3
        
        if not results:
            print("DEBUG: No results found.")
            return {"label": "Unknown", "confidence": 0.0}
            
        best_match = results[0]
        # In Cosine distance, higher score = closer match (1.0 is identical)
        # print(f"DEBUG: Best match {best_match.payload['label']} score={best_match.score}")
        
        if not results:
            return {"label": "Unknown", "confidence": 0.0}
        
        best_match = results[0]
        # In Cosine distance, higher score = closer match (1.0 is identical)
        return {
            "label": best_match.payload["label"],
            "confidence": best_match.score
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset_memory")
def api_reset_memory():
    from qdrant_utils import reset_collection
    success = reset_collection()
    if success:
        return {"status": "success", "message": "Memory cleared."}
    else:
        raise HTTPException(status_code=500, detail="Failed to clear memory.")

@app.get("/signs")
def api_get_signs():
    labels = get_all_labels()
    return {"signs": labels}

class DeleteRequest(BaseModel):
    label: str

@app.post("/delete_sign")
def api_delete_sign(req: DeleteRequest):
    success = delete_sign_by_label(req.label)
    if success:
        return {"status": "success", "message": f"Deleted {req.label}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete sign.")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
