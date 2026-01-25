// Normalizes landmarks to be relative to the wrist (point 0)
// and invariant to scale (distance from camera).

export const normalizeLandmarks = (landmarks, format = 'flat') => {
    if (!landmarks || landmarks.length === 0) return [];

    // 1. Center around Wrist (Index 0)
    const wrist = landmarks[0];
    const centered = landmarks.map(lm => ({
        x: lm.x - wrist.x,
        y: lm.y - wrist.y,
        z: lm.z - wrist.z
    }));

    // 2. Scale Invariance: Calculate max distance from wrist
    let maxDist = 0;
    centered.forEach(lm => {
        const dist = Math.sqrt(lm.x ** 2 + lm.y ** 2 + lm.z ** 2);
        if (dist > maxDist) maxDist = dist;
    });

    const scale = maxDist > 0 ? 1 / maxDist : 1;

    // 3. Normalize
    const normalized = centered.map(lm => ({
        x: lm.x * scale,
        y: lm.y * scale,
        z: lm.z * scale
    }));

    if (format === 'flat') {
        // Flatten to [x1, y1, z1, x2, y2, z2...] and Sanitize
        return normalized.flatMap(lm => [
            isNaN(lm.x) ? 0.0 : lm.x,
            isNaN(lm.y) ? 0.0 : lm.y,
            isNaN(lm.z) ? 0.0 : lm.z
        ]);
    }

    return normalized;
};
