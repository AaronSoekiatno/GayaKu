'use client';

import React from 'react';
import useCamera from '@/hooks/useCamera';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CameraViewProps {
    onVideoReady?: (video: HTMLVideoElement) => void;
}

export default function CameraView({ onVideoReady }: CameraViewProps) {
    const { videoRef, error, isLoading, hasPermission } = useCamera();

    // Notify parent when video is ready
    React.useEffect(() => {
        if (videoRef.current && !isLoading && hasPermission) {
            onVideoReady?.(videoRef.current);
        }
    }, [videoRef, isLoading, hasPermission, onVideoReady]);

    if (isLoading) {
        return (
            <Card className="flex flex-col items-center justify-center min-h-[500px] animate-fade-in">
                <LoadingSpinner />
                <p className="mt-4 text-gray-400">Accessing camera...</p>
            </Card>
        );
    }

    if (error || hasPermission === false) {
        return (
            <Card className="flex flex-col items-center justify-center min-h-[500px] animate-fade-in">
                <div className="text-center max-w-md">
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
            </Card>
        );
    }

    return (
        <div className="relative w-full animate-fade-in">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto rounded-xl shadow-2xl"
                style={{
                    transform: 'scaleX(-1)', // Mirror the video for natural selfie view
                    maxHeight: '80vh',
                    objectFit: 'cover'
                }}
            />

            {/* Overlay indicator when face is detected */}
            <div className="absolute top-4 right-4 glass px-4 py-2 rounded-full">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-black">Live</span>
                </div>
            </div>
        </div>
    );
}
