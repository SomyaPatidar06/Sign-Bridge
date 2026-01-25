from pydantic import BaseModel
from typing import List

class SignSample(BaseModel):
    label: str
    landmarks: List[float]  # Flattened 1890 floats (30 frames * 63 coords)

class PredictionRequest(BaseModel):
    landmarks: List[float]  # Flattened 1890 floats
