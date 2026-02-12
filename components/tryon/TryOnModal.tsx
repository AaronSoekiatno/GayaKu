'use client';

import { useState, useEffect } from 'react';
import { IoAnalyticsOutline } from 'react-icons/io5';
import CameraView from '@/components/camera/CameraView';
import EarringCanvas from '@/components/earrings/EarringCanvas';
import EarringThumbnailGrid from '@/components/earrings/EarringThumbnailGrid';
import SelectedEarringInfo from '@/components/earrings/SelectedEarringInfo';
import useFaceDetection from '@/hooks/useFaceDetection';
import { earringStyles } from '@/lib/earring-data';
import { EarringStyle, EarringCustomization } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface TryOnModalProps {
    onClose: () => void;
}

const DEFAULT_CUSTOMIZATION: EarringCustomization = {
    scale: 1,
    leftOffsetX: 0,
    leftOffsetY: 0,
    rightOffsetX: 0,
    rightOffsetY: 0,
};

export default function TryOnModal({ onClose }: TryOnModalProps) {
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const [selectedEarring, setSelectedEarring] = useState<EarringStyle | null>(null);
    const customization = DEFAULT_CUSTOMIZATION; // Fixed customization, no user adjustment
    const { landmarks, isModelLoaded, error } = useFaceDetection(videoElement);

    // Body scroll lock + Escape key
    useEffect(() => {
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Video dimensions for canvas
    const canvasWidth = videoElement?.videoWidth || 1280;
    const canvasHeight = videoElement?.videoHeight || 720;

    return (
        <div
            className="fixed inset-0 z-50 animate-modal-backdrop bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-6xl h-[90vh] flex flex-col lg:flex-row animate-modal-content rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-50 glass px-2 py-2 rounded-full flex items-center gap-2 hover:bg-white/90 transition-colors cursor-pointer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {/* LEFT: Camera View */}
                <div className="relative flex-1 h-[55%] lg:h-full bg-black overflow-hidden">
                    <CameraView onVideoReady={setVideoElement} fullHeight />

                    {/* Earring Overlay Canvas */}
                    {videoElement && selectedEarring && (
                        <EarringCanvas
                            landmarks={landmarks}
                            selectedEarrings={[selectedEarring]}
                            canvasWidth={canvasWidth}
                            canvasHeight={canvasHeight}
                            customization={customization}
                            fullHeight
                        />
                    )}

                    {/* Model Loading Indicator */}
                    {videoElement && !isModelLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="text-center">
                                <LoadingSpinner />
                                <p className="mt-4 text-gray-300">Loading face detection...</p>
                            </div>
                        </div>
                    )}

                    {/* Analyze Face Shape Button */}
                    {isModelLoaded && (
                        <div className="group absolute bottom-4 left-12">
                            <button className="relative glass w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/90 transition-all duration-300 cursor-pointer z-10">
                                <IoAnalyticsOutline className="w-6 h-6 text-black transition-transform group-hover:scale-110" />
                            </button>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap text-xs font-medium text-black opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-white/90 px-2 py-1 rounded-lg glass z-20">
                                Analyze Face Shape
                            </span>
                        </div>
                    )}

                    {error && (
                        <div className="absolute bottom-4 left-4 glass-strong px-4 py-2 rounded-lg bg-red-500/20">
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}
                </div>

                {/* RIGHT: Sidebar */}
                <div className="w-full lg:w-80 xl:w-96 h-[45%] lg:h-full flex flex-col bg-white/95 backdrop-blur-sm border-l border-gray-200/50">
                    {/* Selected earring info */}
                    <SelectedEarringInfo earring={selectedEarring} />

                    {/* Thumbnail grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <EarringThumbnailGrid
                            earrings={earringStyles}
                            selectedEarring={selectedEarring}
                            onSelectEarring={setSelectedEarring}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}
