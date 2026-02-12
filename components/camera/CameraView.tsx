'use client';

import React from 'react';
import useCamera from '@/hooks/useCamera';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { IoCameraOutline } from 'react-icons/io5';

interface CameraViewProps {
    onVideoReady?: (video: HTMLVideoElement) => void;
    fullHeight?: boolean;
}

export default function CameraView({ onVideoReady, fullHeight = false }: CameraViewProps) {
    const { videoRef, error, isLoading, hasPermission, startCamera } = useCamera();

    // Notify parent when video is ready
    React.useEffect(() => {
        if (videoRef.current && !isLoading && hasPermission) {
            onVideoReady?.(videoRef.current);
        }
    }, [videoRef, isLoading, hasPermission, onVideoReady]);

    const handleEnableCamera = () => {
        startCamera();
    };

    // Show initial state if camera hasn't been started yet (production mode)
    if (hasPermission === null && !isLoading && !error) {
        return (
            <Card className="flex flex-col items-center justify-center min-h-[500px] animate-fade-in">
                <div className="text-center max-w-md">
                    <IoCameraOutline className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-300">Enable Camera</h3>
                    <p className="text-gray-400 mb-6">
                        Click the button below to enable your camera for virtual try-on.
                    </p>
                    <button
                        onClick={handleEnableCamera}
                        className="glass px-6 py-3 rounded-full flex items-center gap-2 hover:bg-white/90 transition-all duration-300 cursor-pointer text-black font-medium mx-auto"
                    >
                        <IoCameraOutline className="w-5 h-5" />
                        Enable Camera
                    </button>
                </div>
            </Card>
        );
    }

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
                    <button
                        onClick={handleEnableCamera}
                        className="mt-4 glass px-6 py-3 rounded-full flex items-center gap-2 hover:bg-white/90 transition-all duration-300 cursor-pointer text-black font-medium"
                    >
                        <IoCameraOutline className="w-5 h-5" />
                        Enable Camera
                    </button>
                    <p className="text-sm text-gray-500 mt-4">
                        Click the button above to enable camera access.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <div className={`relative w-full animate-fade-in ${fullHeight ? 'h-full' : ''}`}>
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
