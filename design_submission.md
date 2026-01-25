# Design Document
**Project Name**: Sign-Bridge
**Version**: 1.0

## 1. System Architecture

Sign-Bridge employs a **Client-Server Architecture** optimized for low-latency visual processing.

### 1.1. High-Level Diagram
```text
[Client Browser] <====> [FastAPI Server] <====> [(Qdrant Vector DB)]
        ^                       ^                        ^
    (Frontend)              (Backend)               (Memory)
```

### 1.2. Components

#### **A. Frontend (The Client)**
- **Technology**: React.js (Vite), Tailwind CSS.
- **Role**: Handles UI, Video Capture, and Hand Tracking.
- **Key Module**: **MediaPipe Vision Tasks**. It runs locally in the browser to extract Hand Landmarks (x,y,z coordinates). By processing video on the client, we save massive bandwidth and protect privacy.

#### **B. Backend (The Server)**
- **Technology**: Python, FastAPI.
- **Role**: Processes motion data and handles logic.
- **Key Module**: **Motion Normalizer**. Converts raw coordinates into a standardized "Motion Sequence" that is invariant to hand size or distance from camera.

#### **C. Database (The Brain)**
- **Technology**: Qdrant (Vector Database).
- **Role**: Stores the "Knowledge Base" of signs.
- **Mechanism**: Signs are stored as high-dimensional vectors. The system uses **Cosine Similarity Search** to find the closest match to the incoming motion sequence.

---

## 2. Data Flow Design

### 2.1. Sign Language Recognition Flow
1.  **Capture**: Browser captures webcam video at 30 FPS.
2.  **Extract**: MediaPipe extracts 21 skeletal landmarks per hand per frame.
3.  **transmit**: The Landmark Array (not video) is sent to the Backend via REST API.
4.  **Vectorize**: Backend converts the temporal sequence of landmarks into a Motion Vector.
5.  **Search**: Qdrant queries this vector against stored classes (e.g., "Hello", "Pain").
6.  **Response**: The matching label is returned to the Frontend.
7.  **Synthesis**: Frontend uses `window.speechSynthesis` to speak the label.

### 2.2. Smart Reply Flow
1.  **Listen**: `window.speechRecognition` listens to audio input.
2.  **Transcribe**: Converts Audio -> Text.
3.  **Analyze**: A heuristic NLP engine scans for keywords (e.g., "Hurt" -> Medical Context).
4.  **Suggest**: Returns a list of strings: `["Head", "Stomach", "Arm"]`.
5.  **Render**: UI renders these strings as clickable buttons.

---

## 3. User Interface (UI) Design

### 3.1. Design Philosophy
- **Accessibility First**: High contrast (Checkered Black/Gray background), Neon Green tracking lines for visibility.
- **Minimal Cognitive Load**: The interface is split clearly into "See" (Camera) and "Read" (Chat).

### 3.2. Layout Structure
- **Main Viewport**:
    -   **Left Panel**: Large Video Feed. Includes overlay of "Confidence Score" and "FPS".
    -   **Right Panel**: Message History. Chat bubbles (User = Right, System/Other = Left).
- **Control Bar (Bottom)**:
    -   **Quick Chips**: Floating buttons for smart replies.
    -   **Mic Toggle**: Large circular button for easy access.
- **Emergency Sidebar (Right Edge)**:
    -   A red, slide-out drawer containing 1-tap emergency messages.

---

## 4. Technology Stack

| Component | Technology | Reasoning |
| :--- | :--- | :--- |
| **Frontend Framework** | React.js | Component-based, fast rendering updates. |
| **Styling** | Tailwind CSS | Rapid UI development, responsive classes. |
| **Computer Vision** | Google MediaPipe | State-of-the-art hand tracking, runs in-browser. |
| **Backend API** | Python FastAPI | Asynchronous performance, native Python support. |
| **Vector DB** | Qdrant | Optimized for high-speed similarity search. |
| **Speech Engine** | Web Speech API | Native browser support (no API keys/cost needed). |
