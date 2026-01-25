# Design Document
**Project**: Sign-Bridge
**Type**: Technical Implementation Guide

## 1. Directory Structure
The project follows a monorepo structure separating the UI and Logic.

```text
sign-bridge/
├── backend/                  # Python FastAPI Server
│   ├── main.py               # API Entry Point
│   ├── models.py             # Pydantic Schemas
│   ├── qdrant_utils.py       # Vector DB Logic
│   └── requirements.txt      # Python Dependencies
├── frontend/                 # React Application
│   ├── src/
│   │   ├── components/       # UI Widgets (Camera, Chat)
│   │   ├── logic/            # MediaPipe Utilities
│   │   │   └── landmarkUtils.js
│   │   └── App.jsx           # Main View Controller
└── database/                 # Qdrant Docker Volumes
```

---

## 2. API Design (Backend)

**Base URL**: `http://localhost:8000`

### A. Predict Sign
*   **Endpoint**: `POST /predict_motion`
*   **Input**: JSON Array of 30 frames (x, y, z coordinates).
*   **Process**: Normalizes vectors -> Queries Qdrant.
*   **Output**: `{"class_name": "Hello", "confidence": 0.95}`

### B. Add New Sign (Training)
*   **Endpoint**: `POST /add_sign`
*   **Input**: `{"label": "Help", "landmarks": [...]}`
*   **Process**: Stores vectors in Qdrant with payload.
*   **Output**: `{"status": "success", "id": 101}`

---

## 3. Database Schema (Qdrant)

The system uses a **Vector Database** instead of SQL.

*   **Collection Name**: `sign_language_motions`
*   **Vector Size**: `1890 Dimensions` (21 points * 3 coords * 30 frames).
*   **Distance Metric**: `Cosine Similarity`
*   **Payload Field**: `{"class_name": "string"}`

---

## 4. Component Hierarchy (Frontend)

**App.jsx (Root)**
1.  **CameraManager** (Handles `<video>` and MediaPipe)
    *   *Props*: `onSignDetected(label)`
    *   *State*: `isTracking`, `frameBuffer`
2.  **ChatInterface** (Displays History)
    *   *Props*: `messages[]`
3.  **SuggestionEngine** (Smart Chips)
    *   *Logic*: Regex match on last received text.

---

## 5. Security & Performance
*   **CORS Policy**: Enabled for `localhost:5173` (Frontend).
*   **Rate Limiting**: None (Localhost execution).
*   **Latency Target**: < 100ms processing time per gesture.
