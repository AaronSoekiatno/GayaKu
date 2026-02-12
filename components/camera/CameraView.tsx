'use client';

import React from 'react';
import useCamera from '@/hooks/useCamera';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CameraViewProps {
    onVideoReady?: (video: HTMLVideoElement) => void;
    fullHeight?: boolean;
}

export default function CameraView({ onVideoReady, fullHeight = false }: CameraViewProps) {
    const { videoRef, error, isLoading, hasPermission } = useCamera();

    // Notify parent when video is ready
    React.useEffect(() => {
        console.log('[CameraView] Video ready check:', {
            hasVideo: !!videoRef.current,
            isLoading,
            hasPermission,
            videoReadyState: videoRef.current?.readyState
        });
        
        if (videoRef.current && !isLoading && hasPermission) {
            console.log('[CameraView] Notifying parent that video is ready');
            onVideoReady?.(videoRef.current);
        }
    }, [videoRef, isLoading, hasPermission, onVideoReady]);

    return (
        <div className={`relative w-full animate-fade-in ${fullHeight ? 'h-full' : ''}`}>
            {/* Error overlay */}
            {(error || hasPermission === false) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="text-center max-w-md px-4">
                        <svg
                            className="w-16 h-16 mx-auto mb-4 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        <h3 className="text-xl font-semibold mb-2 text-red-400">Camera Access Required</h3>
                        <p className="text-gray-400 mb-4">{error}</p>
                        <p className="text-sm text-gray-500">
                            Please enable camera permissions in your browser settings and refresh the page.
                        </p>
                    </div>
                </div>
            )}
            {/* Loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                    <div className="text-center">
                        <LoadingSpinner />
                        <p className="mt-4 text-gray-300">Accessing camera...</p>
                    </div>
                </div>
            )}
            {/* Always render video element so ref is available */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full shadow-2xl ${fullHeight ? 'h-full object-cover' : 'h-auto rounded-xl'}`}
                style={{
                    transform: 'scaleX(-1)',
                    ...(!fullHeight && { maxHeight: '80vh' }),
                    objectFit: 'cover'
                }}
            />
        </div>
    );
}
