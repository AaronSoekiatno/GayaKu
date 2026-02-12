'use client';

import { useState, useEffect, useRef } from 'react';
import { IoAnalyticsOutline, IoCameraOutline, IoDownloadOutline, IoRefreshOutline } from 'react-icons/io5';
import CameraView from '@/components/camera/CameraView';
import EarringCanvas from '@/components/earrings/EarringCanvas';
import EarringThumbnailGrid from '@/components/earrings/EarringThumbnailGrid';
import SelectedEarringInfo from '@/components/earrings/SelectedEarringInfo';
import useFaceDetection from '@/hooks/useFaceDetection';
import { earringStyles } from '@/lib/earring-data';
import { EarringStyle, EarringCustomization, FaceShapeResult } from '@/lib/types';
import { classifyFaceShape } from '@/lib/faceShapeClassifier';
import FaceShapeResultPanel from '@/components/tryon/FaceShapeResult';
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
    const cameraAreaRef = useRef<HTMLDivElement | null>(null);
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const [selectedEarring, setSelectedEarring] = useState<EarringStyle | null>(null);
    const [capturedPhotoBlob, setCapturedPhotoBlob] = useState<Blob | null>(null);
    const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
    const customization = DEFAULT_CUSTOMIZATION; // Fixed customization, no user adjustment
    const { landmarks, isModelLoaded, error, getRawLandmarks } = useFaceDetection(videoElement);
    const [faceShapeResult, setFaceShapeResult] = useState<FaceShapeResult | null>(null);
    const [faceShapeWarning, setFaceShapeWarning] = useState<string | null>(null);
    const [showAnalyzeTutorial, setShowAnalyzeTutorial] = useState(false);

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

    useEffect(() => {
        return () => {
            if (capturedPhotoUrl) {
                URL.revokeObjectURL(capturedPhotoUrl);
            }
        };
    }, [capturedPhotoUrl]);

    const dismissAnalyzeTutorial = () => {
        setShowAnalyzeTutorial(false);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('tryon-analyze-tutorial-seen', '1');
        }
    };

    useEffect(() => {
        if (!isModelLoaded) return;
        if (typeof window === 'undefined') return;

        const hasSeenTutorial = window.localStorage.getItem('tryon-analyze-tutorial-seen') === '1';
        if (!hasSeenTutorial) {
            setShowAnalyzeTutorial(true);
        }
    }, [isModelLoaded]);

    const savePhotoToFile = async (blob: Blob) => {
        const suggestedName = `gayaku-snapshot-${Date.now()}.png`;

        // Prefer native Save As dialog so user can pick folder and filename.
        if ('showSaveFilePicker' in window) {
            try {
                const fileHandle = await (window as any).showSaveFilePicker({
                    suggestedName,
                    types: [
                        {
                            description: 'PNG Image',
                            accept: { 'image/png': ['.png'] }
                        }
                    ]
                });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                return;
            } catch (saveError: any) {
                // User canceled Save As dialog: do nothing.
                if (saveError?.name === 'AbortError') return;
            }
        }

        // Fallback for browsers that don't support File System Access API.
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = suggestedName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
    };

    const handleTakePhoto = async () => {
        const cameraArea = cameraAreaRef.current;
        if (!cameraArea) return;

        const video = cameraArea.querySelector('video');
        if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

        const overlayCanvas = cameraArea.querySelector('canvas');
        const outputCanvas = document.createElement('canvas');
        const outputCtx = outputCanvas.getContext('2d');
        if (!outputCtx) return;

        const width = video.videoWidth;
        const height = video.videoHeight;
        outputCanvas.width = width;
        outputCanvas.height = height;

        // Mirror snapshot to match the on-screen camera view.
        outputCtx.save();
        outputCtx.translate(width, 0);
        outputCtx.scale(-1, 1);
        outputCtx.drawImage(video, 0, 0, width, height);
        outputCtx.restore();

        if (overlayCanvas) {
            outputCtx.save();
            outputCtx.translate(width, 0);
            outputCtx.scale(-1, 1);
            outputCtx.drawImage(overlayCanvas, 0, 0, width, height);
            outputCtx.restore();
        }

        const blob = await new Promise<Blob | null>((resolve) => {
            outputCanvas.toBlob(resolve, 'image/png');
        });

        if (!blob) return;

        if (capturedPhotoUrl) {
            URL.revokeObjectURL(capturedPhotoUrl);
        }

        setCapturedPhotoBlob(blob);
        setCapturedPhotoUrl(URL.createObjectURL(blob));
    };

    const handleDownloadPhoto = async () => {
        if (!capturedPhotoBlob) return;
        await savePhotoToFile(capturedPhotoBlob);
    };

    const handleRetakePhoto = () => {
        if (capturedPhotoUrl) {
            URL.revokeObjectURL(capturedPhotoUrl);
        }
        setCapturedPhotoBlob(null);
        setCapturedPhotoUrl(null);
    };

    const handleAnalyzeFaceShape = () => {
        if (showAnalyzeTutorial) {
            dismissAnalyzeTutorial();
        }

        if (faceShapeResult) {
            setFaceShapeResult(null);
            return;
        }

        const rawLandmarks = getRawLandmarks();
        if (!rawLandmarks || rawLandmarks.length < 468) {
            setFaceShapeWarning('No face detected. Please look at the camera.');
            setTimeout(() => setFaceShapeWarning(null), 3000);
            return;
        }

        if (landmarks && Math.abs(landmarks.headPose.yaw) > 0.5) {
            setFaceShapeWarning('Please face the camera more directly.');
            setTimeout(() => setFaceShapeWarning(null), 3000);
            return;
        }

        setFaceShapeResult(classifyFaceShape(rawLandmarks));
    };

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
                <div ref={cameraAreaRef} className="relative flex-1 h-[55%] lg:h-full bg-black overflow-hidden">
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

                    {/* Camera action buttons */}
                    {isModelLoaded && !capturedPhotoUrl && (
                        <div className="absolute top-4 right-12 z-20 flex items-start gap-3">
                            <div className="group relative">
                                <button
                                    onClick={handleTakePhoto}
                                    className="relative glass w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/90 transition-all duration-300 cursor-pointer z-10"
                                    aria-label="Take photo"
                                >
                                    <IoCameraOutline className="w-6 h-6 text-black transition-transform group-hover:scale-110" />
                                </button>
                                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap text-xs font-medium text-black opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-white/90 px-2 py-1 rounded-lg glass z-20">
                                    Take Photo
                                </span>
                            </div>

                            <div className="group relative">
                                <button
                                    onClick={handleAnalyzeFaceShape}
                                    className={`peer relative glass w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/90 transition-all duration-300 cursor-pointer z-10 ${faceShapeResult ? 'ring-2 ring-[#d4af37] bg-white/90' : ''} ${showAnalyzeTutorial && !faceShapeResult ? 'animate-pulse ring-2 ring-white/70' : ''}`}
                                    aria-label="Analyze face shape"
                                >
                                    <IoAnalyticsOutline className={`w-6 h-6 transition-transform hover:scale-110 ${faceShapeResult ? 'text-[#d4af37]' : 'text-black'}`} />
                                </button>
                                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap text-xs font-medium text-black opacity-0 peer-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-white/90 px-2 py-1 rounded-lg glass z-20">
                                    {faceShapeResult ? 'Close Analysis' : 'Analyze Face Shape'}
                                </span>
                                {showAnalyzeTutorial && !faceShapeResult && (
                                    <>
                                        <div className="absolute top-full right-0 mt-3 z-30 w-64">
                                            <div className="absolute -top-1 right-5 h-3 w-3 rotate-45 bg-white/95 border-l border-t border-gray-200/70" />
                                            <div className="rounded-xl bg-white/95 border border-gray-200/70 shadow-lg p-3 text-xs text-gray-800">
                                                <p className="font-semibold text-gray-900">Step 1</p>
                                                <p className="mt-1 leading-relaxed">
                                                    <span className="font-semibold">Analyze</span> your face shape for personalized earring suggestions.
                                                </p>
                                                <button
                                                    onClick={dismissAnalyzeTutorial}
                                                    className="mt-2 text-[11px] font-medium text-[#6d5afc] hover:underline cursor-pointer"
                                                >
                                                    Got it
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="absolute bottom-4 left-4 glass-strong px-4 py-2 rounded-lg bg-red-500/20">
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    {faceShapeWarning && (
                        <div className="absolute bottom-4 left-4 right-4 lg:right-auto lg:max-w-sm glass px-4 py-3 rounded-lg z-20 animate-slide-up">
                            <p className="text-sm text-gray-700">{faceShapeWarning}</p>
                        </div>
                    )}

                    {capturedPhotoUrl && (
                        <div className="absolute inset-0 z-40 bg-black/95 flex flex-col">
                            <div className="flex-1 min-h-0 flex items-center justify-center p-1">
                                <img
                                    src={capturedPhotoUrl}
                                    alt="Captured preview"
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            </div>
                            <div className="pb-6 px-4 flex items-center justify-center gap-5 bg-black/60">
                                <button
                                    onClick={handleDownloadPhoto}
                                    className="group glass h-10 px-3 rounded-full flex items-center justify-center gap-1.5 text-black hover:bg-white/90 transition-all duration-300 cursor-pointer"
                                    aria-label="Download photo"
                                >
                                    <IoDownloadOutline className="w-4 h-4 transition-transform group-hover:scale-110" />
                                    <span className="text-[11px] font-medium leading-none">Download</span>
                                </button>
                                <button
                                    onClick={handleRetakePhoto}
                                    className="group glass h-10 px-3 rounded-full flex items-center justify-center gap-1.5 text-black hover:bg-white/90 transition-all duration-300 cursor-pointer"
                                    aria-label="Retake photo"
                                >
                                    <IoRefreshOutline className="w-4 h-4 transition-transform group-hover:scale-110" />
                                    <span className="text-[11px] font-medium leading-none">Retry</span>
                                </button>
                            </div>
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

                    {faceShapeResult && (
                        <FaceShapeResultPanel result={faceShapeResult} />
                    )}
                </div>
            </div>
        </div>
    );
}
