'use client';

import { useEffect, useRef, useState } from 'react';
import { FaceLandmarks } from '@/lib/types';

// Type definitions for MediaPipe (loaded dynamically)
interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
}

interface Results {
    multiFaceLandmarks?: NormalizedLandmark[][];
}

export default function useFaceDetection(videoElement: HTMLVideoElement | null) {
    const faceMeshRef = useRef<any>(null);
    const animationFrameRef = useRef<number | null>(null);
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

                // Wait for FaceMesh to be available on window
                const FaceMesh = (window as any).FaceMesh;

                if (!FaceMesh) {
                    throw new Error('FaceMesh not loaded');
                }

                // Initialize MediaPipe Face Mesh
                const faceMesh = new FaceMesh({
                    locateFile: (file: string) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                    }
                });

                // Configure Face Mesh options
                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                // Set up results callback
                faceMesh.onResults((results: Results) => {
                    if (!isActive) return;

                    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                        const faceLandmarks = results.multiFaceLandmarks[0];

                        // Extract ear landmark positions
                        // MediaPipe Face Mesh indices for ear regions:
                        // Left ear: around index 234 (left tragus area)
                        // Right ear: around index 454 (right tragus area)
                        const leftEarLandmark = faceLandmarks[234];
                        const rightEarLandmark = faceLandmarks[454];

                        // Calculate face yaw (horizontal rotation) using nose and face edges
                        // Nose tip: index 1, Left cheek edge: 234, Right cheek edge: 454
                        const noseTip = faceLandmarks[1];

                        // Calculate yaw based on nose position relative to face edges
                        // When facing straight, nose is centered between ears
                        // Yaw range: -1 (looking full left) to +1 (looking full right)
                        let faceYaw = 0;
                        if (noseTip && leftEarLandmark && rightEarLandmark) {
                            const faceWidth = rightEarLandmark.x - leftEarLandmark.x;
                            const noseCenterOffset = noseTip.x - (leftEarLandmark.x + faceWidth / 2);
                            // Normalize to -1 to 1 range (nose can move about half the face width)
                            faceYaw = (noseCenterOffset / (faceWidth / 2)) * 2;
                            // Clamp to -1 to 1
                            faceYaw = Math.max(-1, Math.min(1, faceYaw));
                        }

                        if (leftEarLandmark && rightEarLandmark) {
                            setLandmarks({
                                leftEar: {
                                    x: leftEarLandmark.x,
                                    y: leftEarLandmark.y
                                },
                                rightEar: {
                                    x: rightEarLandmark.x,
                                    y: rightEarLandmark.y
                                },
                                faceYaw
                            });
                        }
                    } else {
                        setLandmarks(null);
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
