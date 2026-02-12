'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export default function useCamera() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = useCallback(async () => {
        // Stop existing stream if any
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Check if getUserMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not available. Please use HTTPS.');
            }

            // Request camera access with optimal settings for face detection
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user' // Front-facing camera
                },
                audio: false
            });

            streamRef.current = mediaStream;
            setStream(mediaStream);
            setHasPermission(true);

            // Attach stream to video element
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                // Explicitly play the video to handle autoplay policies
                try {
                    await videoRef.current.play();
                } catch (playError) {
                    console.warn('Video autoplay failed:', playError);
                }
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setHasPermission(false);

            if (err instanceof Error) {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError('Camera access denied. Please allow camera permissions in your browser settings.');
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    setError('No camera found on this device.');
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    setError('Camera is already in use by another application.');
                } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
                    setError('Camera does not support the requested settings.');
                } else {
                    setError(`Failed to access camera: ${err.message || 'Unknown error'}`);
                }
            } else {
                setError('Failed to access camera. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Auto-start camera when component mounts (only in development)
    // In production, require explicit user interaction for better browser compatibility
    useEffect(() => {
        const isDevelopment = typeof window !== 'undefined' && 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        
        if (isDevelopment) {
            // Small delay to ensure component is fully mounted
            const timer = setTimeout(() => {
                startCamera();
            }, 100);

            return () => {
                clearTimeout(timer);
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
            };
        } else {
            // In production, don't auto-start - require user interaction
            return () => {
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
            };
        }
    }, [startCamera]);

    return {
        videoRef,
        stream,
        error,
        isLoading,
        hasPermission,
        startCamera // Expose function for manual triggering
    };
}
