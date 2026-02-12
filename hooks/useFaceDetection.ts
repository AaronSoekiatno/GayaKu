'use client';

import { useEffect, useRef, useState } from 'react';
import { FaceLandmarks, HeadPose } from '@/lib/types';
import { LandmarkSmoother } from '@/lib/smoothing';

// Type definitions for MediaPipe (loaded dynamically)
interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
}

interface Results {
    multiFaceLandmarks?: NormalizedLandmark[][];
}

/**
 * Estimate the earlobe position using multiple face contour landmarks.
 * MediaPipe Face Mesh doesn't have a landmark on the earlobe itself,
 * so we infer it from the tragus area + jaw angle + face geometry.
 */
function estimateEarLobePosition(
    landmarks: NormalizedLandmark[],
    side: 'left' | 'right'
): { x: number; y: number } {
    const tragusIdx = side === 'left' ? 234 : 454;
    const chinIdx = 152;
    const foreheadIdx = 10;

    const tragus = landmarks[tragusIdx];
    const chin = landmarks[chinIdx];
    const forehead = landmarks[foreheadIdx];

    // Face height as scale-invariant reference
    const faceHeight = Math.abs(chin.y - forehead.y);

    // The earlobe is slightly below the tragus landmark (~8% of face height)
    // and outward from the face mesh edge (~6% of face height) since
    // the actual ear sits beyond the face mesh boundary
    const verticalOffset = faceHeight * 0.05;
    const horizontalOffset = faceHeight * 0.01;
    const outwardSign = side === 'left' ? -1 : 1;

    const estimatedY = tragus.y + verticalOffset;
    const estimatedX = tragus.x + (horizontalOffset * outwardSign);

    return { x: estimatedX, y: estimatedY };
}

/**
 * Compute head pose (yaw, pitch, roll) from face landmarks.
 * Uses a combination of 2D geometry and z-depth for robustness.
 */
function computeHeadPose(landmarks: NormalizedLandmark[]): HeadPose {
    const leftEyeOuter = landmarks[33];
    const rightEyeOuter = landmarks[263];
    const noseTip = landmarks[1];
    const noseBridge = landmarks[6];
    const chin = landmarks[152];
    const forehead = landmarks[10];

    // === ROLL ===
    // Angle of the line connecting the two eye outer corners relative to horizontal
    const eyeDx = rightEyeOuter.x - leftEyeOuter.x;
    const eyeDy = rightEyeOuter.y - leftEyeOuter.y;
    const roll = Math.atan2(eyeDy, eyeDx);

    // === YAW ===
    // Method 1: Nose offset relative to eye midpoint (2D)
    const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
    const faceWidth = Math.abs(eyeDx) || 0.001;
    const noseOffset = (noseTip.x - eyeMidX) / faceWidth;
    const yawFromNose = Math.asin(Math.max(-1, Math.min(1, noseOffset * 2)));

    // Method 2: Z-difference between left and right eye (depth-based)
    const zDiff = leftEyeOuter.z - rightEyeOuter.z;
    const yawFromZ = Math.asin(Math.max(-1, Math.min(1, zDiff * 3)));

    // Blend both for stability at small angles + correctness at large angles
    const yaw = yawFromNose * 0.5 + yawFromZ * 0.5;

    // === PITCH ===
    // Method 1: Ratio of forehead-to-nose vs nose-to-chin vertical distances
    const foreheadToNoseY = noseTip.y - forehead.y;
    const noseToChinY = chin.y - noseTip.y;
    const verticalRatio = foreheadToNoseY / (noseToChinY || 0.001);
    const pitchFromRatio = Math.atan2(verticalRatio - 1.0, 1.0);

    // Method 2: Z difference between nose bridge and nose tip
    const pitchZ = noseBridge.z - noseTip.z;
    const pitchFromZ = Math.asin(Math.max(-1, Math.min(1, pitchZ * 4)));

    const pitch = pitchFromRatio * 0.4 + pitchFromZ * 0.6;

    return { yaw, pitch, roll };
}

/**
 * Compute face scale using inter-pupillary distance.
 * Returns normalized distance that scales proportionally with camera distance.
 */
function computeFaceScale(landmarks: NormalizedLandmark[]): number {
    // Prefer iris landmarks (available with refineLandmarks: true)
    if (landmarks.length > 473) {
        const leftIris = landmarks[468];
        const rightIris = landmarks[473];
        return Math.sqrt(
            Math.pow(rightIris.x - leftIris.x, 2) +
            Math.pow(rightIris.y - leftIris.y, 2)
        );
    }
    // Fallback to eye outer corners
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    return Math.sqrt(
        Math.pow(rightEye.x - leftEye.x, 2) +
        Math.pow(rightEye.y - leftEye.y, 2)
    );
}

export default function useFaceDetection(videoElement: HTMLVideoElement | null) {
    const faceMeshRef = useRef<any>(null);
    const animationFrameRef = useRef<number | null>(null);
    const smootherRef = useRef(new LandmarkSmoother(0.65));
    const [landmarks, setLandmarks] = useState<FaceLandmarks | null>(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!videoElement || typeof window === 'undefined') return;

        let isActive = true;

        const initializeFaceMesh = async () => {
            try {
                // Dynamically load MediaPipe Face Mesh from CDN
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
                script.crossOrigin = 'anonymous';

                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });

                const FaceMesh = (window as any).FaceMesh;

                if (!FaceMesh) {
                    throw new Error('FaceMesh not loaded');
                }

                const faceMesh = new FaceMesh({
                    locateFile: (file: string) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                    }
                });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                faceMesh.onResults((results: Results) => {
                    if (!isActive) return;

                    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                        const fl = results.multiFaceLandmarks[0];
                        const smoother = smootherRef.current;

                        // Estimate ear lobe positions
                        const leftLobe = estimateEarLobePosition(fl, 'left');
                        const rightLobe = estimateEarLobePosition(fl, 'right');

                        // Compute head pose
                        const headPose = computeHeadPose(fl);

                        // Compute face scale and depth
                        const faceScale = computeFaceScale(fl);
                        const faceDepth = (fl[1].z + fl[6].z) / 2;

                        // Apply temporal smoothing to all values
                        const smoothedLeftLobe = {
                            x: smoother.smooth('leftLobeX', leftLobe.x),
                            y: smoother.smooth('leftLobeY', leftLobe.y),
                        };
                        const smoothedRightLobe = {
                            x: smoother.smooth('rightLobeX', rightLobe.x),
                            y: smoother.smooth('rightLobeY', rightLobe.y),
                        };
                        const smoothedHeadPose: HeadPose = {
                            yaw: smoother.smooth('yaw', headPose.yaw),
                            pitch: smoother.smooth('pitch', headPose.pitch),
                            roll: smoother.smooth('roll', headPose.roll),
                        };
                        const smoothedFaceScale = smoother.smooth('faceScale', faceScale);
                        const smoothedFaceDepth = smoother.smooth('faceDepth', faceDepth);

                        setLandmarks({
                            leftEarLobe: smoothedLeftLobe,
                            rightEarLobe: smoothedRightLobe,
                            headPose: smoothedHeadPose,
                            faceScale: smoothedFaceScale,
                            faceDepth: smoothedFaceDepth,
                        });
                    } else {
                        setLandmarks(null);
                        smootherRef.current.reset();
                    }
                });

                await faceMesh.initialize();
                faceMeshRef.current = faceMesh;
                setIsModelLoaded(true);

                // Start processing frames
                const processFrame = async () => {
                    if (!isActive || !faceMeshRef.current) return;

                    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
                        await faceMeshRef.current.send({ image: videoElement });
                    }

                    animationFrameRef.current = requestAnimationFrame(processFrame);
                };

                processFrame();

            } catch (err) {
                console.error('Face Mesh initialization error:', err);
                setError('Failed to load face detection model.');
            }
        };

        initializeFaceMesh();

        // Cleanup
        return () => {
            isActive = false;

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            if (faceMeshRef.current) {
                faceMeshRef.current.close();
            }
        };
    }, [videoElement]);

    return {
        landmarks,
        isModelLoaded,
        error
    };
}
