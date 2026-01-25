# Sign-Bridge - AI Sign Language Interpreter

[![React](https://img.shields.io/badge/React-18.0-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.95-green.svg)](https://fastapi.tiangolo.com/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-red.svg)](https://qdrant.tech/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Vision-orange.svg)](https://developers.google.com/mediapipe)
[![HTTPS](https://img.shields.io/badge/SSL-Secure-brightgreen.svg)]()

**Sign-Bridge** is an intelligent accessibility tool designed to bridge the communication gap between the Deaf community and the hearing world. Using computer vision and vector similarity search, it translates dynamic sign language gestures into speech and converts spoken voice into text in real-time.

### 🚀 **Live Demo:** [https://sign-bridge.duckdns.org](https://sign-bridge.duckdns.org)

*(Note: Hosted on a private Ubuntu VPS using Nginx & Docker. Microphone access requires HTTPS, which is fully enabled).*

---

## Features

-   **👋 Real-time Sign Translation**: Uses `MediaPipe` to extract 80+ hand landmarks and `Qdrant` vector search to recognize dynamic signs (e.g., "Hello", "Hungry", "Help") instantly.
-   **🗣️ Hands-to-Voice**: Detected signs are spoken out loud using the Web Speech API, enabling fluent conversation.
-   **📝 Voice-to-Text Bridge**: Listens to spoken language and displays captions for Deaf users, ensuring two-way communication.
-   **🧠 Smart Context Replies**: AI analyzes the conversation context (e.g., "Are you hungry?") and suggests one-tap replies ("Yes", "No"), reducing the need to sign for every answer.
-   **🚨 Emergency Panic Mode**: A dedicated safety feature that triggers visual alarms and speaks urgent phrases like "Call Police" or "I need help".
-   **📱 Responsive Design**: Built with Tailwind CSS for a seamless experience on laptops and tablets.

---

## Tech Stack & Infrastructure

This project demonstrates advanced integration of Computer Vision, Vector Databases, and Modern Web Frameworks.

### **Frontend**
-   **React.js**: Component-based UI architecture.
-   **Tailwind CSS**: Modern, responsive styling.
-   **MediaPipe**: Google's ML framework for ultra-fast, client-side Hand Tracking.
-   **Web Speech API**: Native browser support for TTS (Text-to-Speech) and STT (Speech-to-Text).

### **Backend**
-   **Python / FastAPI**: High-performance Async API.
-   **Qdrant**: Vector Similarity Search Engine to store and retrieve 1890-dimensional motion embeddings.
-   **NumPy**: Efficient numerical processing for landmark normalization.

### **DevOps & Deployment**
-   **Server**: Ubuntu VPS.
-   **Web Server**: Nginx (Reverse Proxy & Virtual Host).
-   **Containerization**: Docker (for Qdrant).
-   **Process Management**: Systemd (Auto-restart).
-   **Security**: SSL/TLS Certificate via Let's Encrypt (Certbot).

---

## 📸 Gallery

### **1. Live Translation Interface**
Real-time hand tracking and sign recognition with confidence scores.
![Translation Mode](https://placehold.co/800x450?text=Live+Translation+Interface)  
*(Replace with actual screenshot)*

### **2. Smart Context Suggestions**
AI suggesting replies based on the conversation flow.
![Smart Suggestions](https://placehold.co/800x450?text=Smart+Suggestions)
*(Replace with actual screenshot)*

### **3. Emergency Sidebar**
Quick access to safety tools.
![Panic Mode](https://placehold.co/800x450?text=Emergency+Sidebar)
*(Replace with actual screenshot)*

---

## 🔧 Setup & Installation (Local)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/sign-bridge.git
    cd sign-bridge
    ```

2.  **Start the Backend (The Brain)**:
    ```bash
    cd backend
    pip install -r requirements.txt
    python main.py
    ```
    *(Runs on http://localhost:8000)*

3.  **Start the Frontend (The Interface)**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    *(Runs on http://localhost:5173)*

---

**Developed by: Somya Patidar & Prachi Panwar**
