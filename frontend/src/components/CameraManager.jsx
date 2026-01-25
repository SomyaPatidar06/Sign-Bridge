import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { normalizeLandmarks } from '../logic/landmarkUtils';

const CameraManager = forwardRef((props, ref) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [landmarker, setLandmarker] = useState(null);
    const [lastLandmarks, setLastLandmarks] = useState(null);

    useImperativeHandle(ref, () => ({
        getLandmarks: () => {
            // Return flat normalized landmarks
            return lastLandmarks ? normalizeLandmarks(lastLandmarks) : null;
        }
    }));

    useEffect(() => {
        const initLandmarker = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            const handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });
            setLandmarker(handLandmarker);
        };
        initLandmarker();
    }, []);

    useEffect(() => {
        const startCamera = async () => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.addEventListener('loadeddata', predictWebcam);
                }
            }
        };
        startCamera();
    }, [landmarker]);

    const predictWebcam = async () => {
        if (!landmarker || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        let startTimeMs = performance.now();
        const results = landmarker.detectForVideo(video, startTimeMs);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.landmarks && results.landmarks.length > 0) {
            setLastLandmarks(results.landmarks[0]);

            // Draw landmarks
            for (const landmarks of results.landmarks) {
                for (const point of landmarks) {
                    ctx.beginPath();
                    ctx.arc(point.x * canvas.width, point.y * canvas.height, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = "#00FF00";
                    ctx.fill();
                }
            }
        } else {
            setLastLandmarks(null);
        }

        requestAnimationFrame(predictWebcam);
    };

    return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-700">
            <video ref={videoRef} autoPlay playsInline className="block w-full h-auto" style={{ transform: "scaleX(-1)" }} />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ transform: "scaleX(-1)" }} />
            {!landmarker && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
                    Loading AI Model...
                </div>
            )}
        </div>
    );
});

export default CameraManager;
