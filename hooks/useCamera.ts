'use client';

import { useEffect, useRef, useState } from 'react';

export default function useCamera() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    useEffect(() => {
        let currentStream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Request camera access with optimal settings for face detection
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user' // Front-facing camera
                    },
                    audio: false
                });

                currentStream = mediaStream;
                setStream(mediaStream);
                setHasPermission(true);

                // Attach stream to video element
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error('Camera access error:', err);
                setHasPermission(false);

                if (err instanceof Error) {
                    if (err.name === 'NotAllowedError') {
                        setError('Camera access denied. Please allow camera permissions.');
                    } else if (err.name === 'NotFoundError') {
                        setError('No camera found on this device.');
                    } else {
                        setError('Failed to access camera. Please try again.');
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };

        startCamera();

        // Cleanup function
        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return {
        videoRef,
        stream,
        error,
        isLoading,
        hasPermission
    };
}
