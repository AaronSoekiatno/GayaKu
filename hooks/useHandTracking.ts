'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface HandLandmark {
    x: number;
    y: number;
    z: number;
}

interface HandResults {
    multiHandLandmarks?: HandLandmark[][];
    multiHandedness?: { label: string }[];
}

export interface PinchState {
    isPinching: boolean;
    position: { x: number; y: number } | null; // Normalized 0-1 coordinates
    hand: 'left' | 'right' | null;
}

export interface HandGesture {
    isOpenPalm: boolean;
    position: { x: number; y: number } | null; // Normalized 0-1 coordinates
    hand: 'left' | 'right' | null;
}

interface UseHandTrackingReturn {
    pinchState: PinchState;
    openPalmGesture: HandGesture;
    isModelLoaded: boolean;
    error: string | null;
}

// Distance threshold for pinch detection (normalized coordinates)
const PINCH_THRESHOLD = 0.05;

export default function useHandTracking(
    videoElement: HTMLVideoElement | null,
    enabled: boolean = true
): UseHandTrackingReturn {
    const handsRef = useRef<any>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [pinchState, setPinchState] = useState<PinchState>({
        isPinching: false,
        position: null,
        hand: null
    });
    const [openPalmGesture, setOpenPalmGesture] = useState<HandGesture>({
        isOpenPalm: false,
        position: null,
        hand: null
    });
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const processResults = useCallback((results: HandResults) => {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            setPinchState({ isPinching: false, position: null, hand: null });
            setOpenPalmGesture({ isOpenPalm: false, position: null, hand: null });
            return;
        }

        let pinchDetected = false;
        let openPalmDetected = false;

        // Check each detected hand for gestures
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const handedness = results.multiHandedness?.[i]?.label?.toLowerCase() as 'left' | 'right';

            // Thumb tip: index 4, Index finger tip: index 8
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];

            // Calculate distance between thumb and index finger for pinch detection
            const distance = Math.sqrt(
                Math.pow(thumbTip.x - indexTip.x, 2) +
                Math.pow(thumbTip.y - indexTip.y, 2)
            );

            if (distance < PINCH_THRESHOLD) {
                // Pinch detected - use midpoint between thumb and index as position
                const pinchX = (thumbTip.x + indexTip.x) / 2;
                const pinchY = (thumbTip.y + indexTip.y) / 2;

                setPinchState({
                    isPinching: true,
                    position: { x: pinchX, y: pinchY },
                    // MediaPipe returns handedness from camera's perspective, flip for selfie view
                    hand: handedness === 'left' ? 'right' : 'left'
                });
                pinchDetected = true;
            }

            // Check for open palm: all fingers extended (tips above PIP joints)
            // Landmark indices: 8 (index tip), 12 (middle tip), 16 (ring tip), 20 (pinky tip)
            // PIP joints: 6 (index), 10 (middle), 14 (ring), 18 (pinky)
            const indexTipY = landmarks[8].y;
            const indexPipY = landmarks[6].y;
            const middleTipY = landmarks[12].y;
            const middlePipY = landmarks[10].y;
            const ringTipY = landmarks[16].y;
            const ringPipY = landmarks[14].y;
            const pinkyTipY = landmarks[20].y;
            const pinkyPipY = landmarks[18].y;

            // All fingertips should be above their PIP joints (lower Y value = higher on screen)
            const allFingersExtended = 
                indexTipY < indexPipY &&
                middleTipY < middlePipY &&
                ringTipY < ringPipY &&
                pinkyTipY < pinkyPipY;

            if (allFingersExtended && distance >= PINCH_THRESHOLD) {
                // Open palm detected - use center of palm (wrist is index 0)
                const wrist = landmarks[0];
                setOpenPalmGesture({
                    isOpenPalm: true,
                    position: { x: wrist.x, y: wrist.y },
                    hand: handedness === 'left' ? 'right' : 'left'
                });
                openPalmDetected = true;
            }
        }

        // Reset states if gestures not detected
        if (!pinchDetected) {
            setPinchState({ isPinching: false, position: null, hand: null });
        }
        if (!openPalmDetected) {
            setOpenPalmGesture({ isOpenPalm: false, position: null, hand: null });
        }
    }, []);

    useEffect(() => {
        if (!videoElement || typeof window === 'undefined' || !enabled) return;

        let isActive = true;

        const initializeHands = async () => {
            try {
                // Check if Hands is already loaded
                if ((window as any).Hands) {
                    await setupHands((window as any).Hands);
                    return;
                }

                // Dynamically load MediaPipe Hands from CDN
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
                script.crossOrigin = 'anonymous';

                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });

                const Hands = (window as any).Hands;
                if (!Hands) {
                    throw new Error('Hands not loaded');
                }

                await setupHands(Hands);
            } catch (err) {
                console.error('Hand tracking initialization error:', err);
                setError('Failed to load hand tracking model.');
            }
        };

        const setupHands = async (Hands: any) => {
            if (!isActive) return;

            const hands = new Hands({
                locateFile: (file: string) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 0, // Use lite model for better performance
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            hands.onResults((results: HandResults) => {
                if (!isActive) return;
                processResults(results);
            });

            await hands.initialize();
            handsRef.current = hands;
            setIsModelLoaded(true);

            // Start processing frames
            const processFrame = async () => {
                if (!isActive || !handsRef.current) return;

                if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
                    await handsRef.current.send({ image: videoElement });
                }

                animationFrameRef.current = requestAnimationFrame(processFrame);
            };

            processFrame();
        };

        initializeHands();

        return () => {
            isActive = false;

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            if (handsRef.current) {
                handsRef.current.close();
                handsRef.current = null;
            }
        };
    }, [videoElement, enabled, processResults]);

    return {
        pinchState,
        openPalmGesture,
        isModelLoaded,
        error
    };
}
