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
        console.log('[useCamera] startCamera called');
        console.log('[useCamera] Environment:', {
            hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
            protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
            href: typeof window !== 'undefined' ? window.location.href : 'N/A',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
        });

        // Stop existing stream if any
        if (streamRef.current) {
            console.log('[useCamera] Stopping existing stream');
            streamRef.current.getTracks().forEach(track => {
                console.log('[useCamera] Stopping track:', track.kind, track.label);
                track.stop();
            });
            streamRef.current = null;
        }

        try {
            setIsLoading(true);
            setError(null);
            console.log('[useCamera] Starting camera access...');

            // Check environment
            if (typeof window !== 'undefined') {
                console.log('[useCamera] Protocol check:', {
                    protocol: window.location.protocol,
                    isHTTPS: window.location.protocol === 'https:',
                    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                });
            }

            // Check if getUserMedia is available
            console.log('[useCamera] Checking navigator.mediaDevices:', {
                exists: typeof navigator !== 'undefined' && !!navigator.mediaDevices,
                getUserMediaExists: typeof navigator !== 'undefined' && 
                    navigator.mediaDevices && 
                    typeof navigator.mediaDevices.getUserMedia === 'function'
            });

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                const errorMsg = 'Camera API not available. Please use HTTPS.';
                console.error('[useCamera]', errorMsg);
                throw new Error(errorMsg);
            }

            // Check permissions API if available
            if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
                try {
                    const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
                    console.log('[useCamera] Camera permission status:', permissionStatus.state);
                } catch (permError) {
                    console.warn('[useCamera] Could not query camera permission:', permError);
                }
            }

            console.log('[useCamera] Requesting camera with constraints:', {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false
            });

            // Request camera access with optimal settings for face detection
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user' // Front-facing camera
                },
                audio: false
            });

            console.log('[useCamera] Camera access granted!', {
                streamId: mediaStream.id,
                active: mediaStream.active,
                tracks: mediaStream.getTracks().map(track => ({
                    kind: track.kind,
                    label: track.label,
                    enabled: track.enabled,
                    readyState: track.readyState,
                    settings: track.getSettings()
                }))
            });

            streamRef.current = mediaStream;
            setStream(mediaStream);
            setHasPermission(true);

            // Attach stream to video element
            if (videoRef.current) {
                console.log('[useCamera] Attaching stream to video element:', {
                    videoExists: !!videoRef.current,
                    currentSrc: videoRef.current.src,
                    currentSrcObject: videoRef.current.srcObject
                });

                videoRef.current.srcObject = mediaStream;
                
                console.log('[useCamera] Video element state:', {
                    srcObject: !!videoRef.current.srcObject,
                    readyState: videoRef.current.readyState,
                    videoWidth: videoRef.current.videoWidth,
                    videoHeight: videoRef.current.videoHeight,
                    paused: videoRef.current.paused
                });

                // Explicitly play the video to handle autoplay policies
                try {
                    console.log('[useCamera] Attempting to play video...');
                    await videoRef.current.play();
                    console.log('[useCamera] Video play() succeeded');
                } catch (playError) {
                    console.error('[useCamera] Video autoplay failed:', playError);
                    console.error('[useCamera] Play error details:', {
                        name: playError instanceof Error ? playError.name : 'Unknown',
                        message: playError instanceof Error ? playError.message : String(playError)
                    });
                }
            } else {
                console.warn('[useCamera] videoRef.current is null, cannot attach stream');
            }
        } catch (err) {
            console.error('[useCamera] Camera access error:', err);
            console.error('[useCamera] Error details:', {
                name: err instanceof Error ? err.name : 'Unknown',
                message: err instanceof Error ? err.message : String(err),
                stack: err instanceof Error ? err.stack : undefined
            });
            
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
            console.log('[useCamera] startCamera completed, isLoading set to false');
        }
    }, []);

    // Auto-start camera when component mounts
    useEffect(() => {
        console.log('[useCamera] Component mounted, setting up auto-start');
        console.log('[useCamera] Initial state:', {
            hasVideoRef: !!videoRef.current,
            isLoading,
            hasPermission,
            error
        });

        // Small delay to ensure component is fully mounted
        const timer = setTimeout(() => {
            console.log('[useCamera] Auto-starting camera after delay');
            startCamera();
        }, 100);

        return () => {
            console.log('[useCamera] Component unmounting, cleaning up');
            clearTimeout(timer);
            if (streamRef.current) {
                console.log('[useCamera] Stopping stream tracks on unmount');
                streamRef.current.getTracks().forEach(track => {
                    track.stop();
                });
                streamRef.current = null;
            }
        };
    }, [startCamera]);

    // Log state changes
    useEffect(() => {
        console.log('[useCamera] State changed:', {
            isLoading,
            hasPermission,
            error,
            hasStream: !!stream,
            hasVideoRef: !!videoRef.current
        });
    }, [isLoading, hasPermission, error, stream]);

    return {
        videoRef,
        stream,
        error,
        isLoading,
        hasPermission,
        startCamera // Expose function for manual triggering
    };
}
