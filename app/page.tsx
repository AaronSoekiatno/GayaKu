'use client';

import { useState, useEffect, useRef } from 'react';
import { IoColorPaletteOutline, IoScanOutline, IoSparklesOutline, IoHandLeftOutline } from 'react-icons/io5';
import CameraView from '@/components/camera/CameraView';
import EarringCanvas from '@/components/earrings/EarringCanvas';
import EarringGallery from '@/components/earrings/EarringGallery';
import EarringControls from '@/components/earrings/EarringControls';
import GestureOverlay from '@/components/earrings/GestureOverlay';
import useFaceDetection from '@/hooks/useFaceDetection';
import useHandTracking from '@/hooks/useHandTracking';
import { earringStyles } from '@/lib/earring-data';
import { EarringStyle, EarringCustomization } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';

const DEFAULT_CUSTOMIZATION: EarringCustomization = {
  scale: 1,
  leftOffsetX: 0,
  leftOffsetY: 15,   // Default offset down toward earlobe
  rightOffsetX: 0,
  rightOffsetY: 15,  // Default offset down toward earlobe
};

export default function Home() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [selectedEarring, setSelectedEarring] = useState<EarringStyle | null>(null);
  const [customization, setCustomization] = useState<EarringCustomization>(DEFAULT_CUSTOMIZATION);
  const [gestureMode, setGestureMode] = useState(false);
  const { landmarks, isModelLoaded, error } = useFaceDetection(videoElement);
  const { pinchState, openPalmGesture, isModelLoaded: isHandModelLoaded } = useHandTracking(videoElement, gestureMode);

  const handleResetCustomization = () => {
    setCustomization(DEFAULT_CUSTOMIZATION);
  };

  // Handle open palm gesture to select "none"
  const openPalmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (openPalmGesture.isOpenPalm && gestureMode) {
      // Clear any existing timeout
      if (openPalmTimeoutRef.current) {
        clearTimeout(openPalmTimeoutRef.current);
      }
      
      // Set a small delay to avoid accidental triggers
      openPalmTimeoutRef.current = setTimeout(() => {
        setSelectedEarring(null);
      }, 500); // 500ms delay to confirm gesture
    } else {
      // Clear timeout if gesture stops
      if (openPalmTimeoutRef.current) {
        clearTimeout(openPalmTimeoutRef.current);
        openPalmTimeoutRef.current = null;
      }
    }

    return () => {
      if (openPalmTimeoutRef.current) {
        clearTimeout(openPalmTimeoutRef.current);
      }
    };
  }, [openPalmGesture.isOpenPalm, gestureMode]);

  // Get video dimensions for canvas
  const canvasWidth = videoElement?.videoWidth || 1280;
  const canvasHeight = videoElement?.videoHeight || 720;

  // Landing page before camera is activated
  if (!isCameraActive) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-12 flex items-center justify-between">
          <h1 className="text-3xl md:text-5xl font-bold gradient-text">GayaKu</h1>
        </header>

        {/* Hero Section */}
        <div className="flex-1 w-full px-4">
          <div className="mx-auto w-full max-w-5xl animate-fade-in pt-8 md:pt-12 pb-16 text-center">
            <h2 className="text-2xl md:text-6xl font-bold mb-6 gradient-text">
              Try On Earrings Instantly
            </h2>
            <p className="text-xl text-gray-600 mb-8 mx-auto max-w-2xl">
              Use AI-powered face detection to see how different earring styles look on you in real-time
            </p>
            <Button
              size="md"
              variant="primary"
              onClick={() => setIsCameraActive(true)}
              className="text-lg px-12 py-3"
            >
              Try Now
            </Button>

            {/* Features */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="glass hover-lift rounded-xl p-12 min-h-[280px] overflow-hidden min-w-0 flex flex-col items-center">
                <IoColorPaletteOutline className="mx-auto h-8 w-8 text-gray-500" aria-hidden="true" />
                <h3 className="mt-7 text-lg font-semibold">Style Preferences</h3>
                <p className="mt-3 text-md text-gray-500 leading-relaxed break-words">
                  Explore different earrings by your favorite brands, colors, and styles.
                </p>
              </div>
              <div className="glass hover-lift rounded-xl p-12 min-h-[280px] overflow-hidden min-w-0 flex flex-col items-center">
                <IoSparklesOutline className="mx-auto h-8 w-8 text-gray-500" aria-hidden="true" />
                <h3 className="mt-7 text-lg font-semibold">Virtual Try-On</h3>
                <p className="mt-3 text-md text-gray-500 leading-relaxed break-words">
                  Experience a virtual try-on of earrings using our AR technology, ensuring you look good before you buy.
                </p>
              </div>
              <div className="glass hover-lift rounded-xl p-12 min-h-[280px] overflow-hidden min-w-0 flex flex-col items-center">
                <IoScanOutline className="mx-auto h-8 w-8 text-gray-500" aria-hidden="true" />
                <h3 className="mt-7 text-lg font-semibold">Smart Face Scan</h3>
                <p className="mt-3 text-md text-gray-500 leading-relaxed break-words">
                  Our technology scans and analyzes your face shape to recommend and explain your best-fit earrings and hair styles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Camera view after activation
  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 animate-fade-in flex justify-end items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCameraActive(false)}
          className="flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Close
        </Button>
      </header>

      <div className="max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Camera View - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="relative">
              <CameraView onVideoReady={setVideoElement} />

              {/* Earring Overlay Canvas */}
              {videoElement && selectedEarring && (
                <EarringCanvas
                  videoElement={videoElement}
                  landmarks={landmarks}
                  selectedEarrings={selectedEarring ? [selectedEarring] : []}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  customization={customization}
                />
              )}

              {/* Gesture Overlay for pinch-to-drag */}
              {gestureMode && landmarks && (
                <GestureOverlay
                  pinchState={pinchState}
                  landmarks={landmarks}
                  customization={customization}
                  onCustomizationChange={setCustomization}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                />
              )}

              {/* Model Loading Indicator */}
              {videoElement && !isModelLoaded && (
                <div className="absolute inset-0 flex items-center justify-center glass rounded-xl">
                  <div className="text-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-300">Loading face detection model...</p>
                  </div>
                </div>
              )}

              {/* Face Detection Status */}
              {isModelLoaded && (
                <div className="absolute bottom-4 left-4 glass px-4 py-2 rounded-full">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${landmarks ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                    <span className="text-sm text-black">
                      {landmarks ? 'Face detected' : 'Looking for face...'}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute bottom-4 left-4 glass-strong px-4 py-2 rounded-lg bg-red-500/20">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-8">
            {/* How It Works - Show when no earring is selected */}
            {!selectedEarring && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-semibold mb-4 gradient-text">How It Works</h2>
                <div className="glass rounded-xl p-6 space-y-4">
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#d4af37] flex items-center justify-center text-sm font-semibold text-white shadow-md">1</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-1">Select a style</p>
                      <p className="text-xs text-gray-600">Choose an earring from the gallery below</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#d4af37] flex items-center justify-center text-sm font-semibold text-white shadow-md">2</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-1">See it on you</p>
                      <p className="text-xs text-gray-600">The earring appears on your ears in real-time</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#d4af37] flex items-center justify-center text-sm font-semibold text-white shadow-md">3</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 mb-1">Adjust & explore</p>
                      <p className="text-xs text-gray-600">Move your head or adjust size to see different angles</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Customization Controls */}
            {selectedEarring && isModelLoaded && (
              <div className="animate-fade-in space-y-4">
                <EarringControls
                  customization={customization}
                  onChange={setCustomization}
                  onReset={handleResetCustomization}
                />

                {/* Gesture Mode Toggle */}
                <div className="glass rounded-xl p-4">
                  <button
                    onClick={() => setGestureMode(!gestureMode)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      gestureMode
                        ? 'bg-[#d4af37]/20 border border-[#d4af37]'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IoHandLeftOutline className={`w-5 h-5 ${gestureMode ? 'text-[#d4af37]' : 'text-gray-600'}`} />
                      <div className="text-left">
                        <p className={`text-sm font-medium ${gestureMode ? 'text-[#d4af37]' : 'text-gray-700'}`}>
                          Gesture Control
                        </p>
                        <p className="text-xs text-gray-500">
                          Pinch and drag to adjust
                        </p>
                      </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors ${gestureMode ? 'bg-[#d4af37]' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 mt-1 rounded-full bg-white shadow transition-transform ${gestureMode ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                  </button>
                  {gestureMode && !isHandModelLoaded && (
                    <p className="text-xs text-gray-500 mt-2 text-center">Loading hand tracking...</p>
                  )}
                  {gestureMode && isHandModelLoaded && (
                    <p className="text-xs text-[#d4af37] mt-2 text-center">Pinch near an earring and drag to move it</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Earring Gallery */}
        <EarringGallery
          earrings={earringStyles}
          selectedEarring={selectedEarring}
          onSelectEarring={setSelectedEarring}
        />
      </div>

      {/* Footer */}
      <footer className="text-center mt-12 text-gray-500 text-sm">
        <p>Powered by MediaPipe Face Mesh • Built with Next.js</p>
      </footer>
    </div>
  );
}

