'use client';

import { useState } from 'react';
import CameraView from '@/components/camera/CameraView';
import EarringCanvas from '@/components/earrings/EarringCanvas';
import EarringGallery from '@/components/earrings/EarringGallery';
import useFaceDetection from '@/hooks/useFaceDetection';
import { earringStyles } from '@/lib/earring-data';
import { EarringStyle } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';

export default function Home() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [selectedEarring, setSelectedEarring] = useState<EarringStyle | null>(earringStyles[0]);
  const { landmarks, isModelLoaded, error } = useFaceDetection(videoElement);

  // Get video dimensions for canvas
  const canvasWidth = videoElement?.videoWidth || 1280;
  const canvasHeight = videoElement?.videoHeight || 720;

  // Landing page before camera is activated
  if (!isCameraActive) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-10 flex items-center justify-between">
          <h1 className="text-2xl">GayaKu</h1>
        </header>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-2xl animate-fade-in">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Try On Earrings Instantly
            </h2>
            <p className="text-xl text-gray-600 mb-8">
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
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="glass rounded-xl p-6">
                <div className="text-3xl mb-3">📸</div>
                <h3 className="text-lg font-semibold mb-2">Real-Time Preview</h3>
                <p className="text-sm text-gray-500">See earrings on your face instantly with live tracking</p>
              </div>
              <div className="glass rounded-xl p-6">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
                <p className="text-sm text-gray-500">All processing happens in your browser</p>
              </div>
              <div className="glass rounded-xl p-6">
                <div className="text-3xl mb-3">✨</div>
                <h3 className="text-lg font-semibold mb-2">No Installation</h3>
                <p className="text-sm text-gray-500">Works directly in your web browser</p>
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
      <header className="mb-8 animate-fade-in">
        <h1 className="text-3xl">GayaKu</h1>
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
                    <span className="text-sm text-gray-200">
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
          <div className="space-y-6">
            <div className="glass-strong rounded-xl p-6 animate-fade-in">
              <h2 className="text-2xl font-semibold mb-4 gradient-text">How It Works</h2>
              <ol className="space-y-3 text-gray-300">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-sm font-semibold">1</span>
                  <span>Allow camera access when prompted</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-sm font-semibold">2</span>
                  <span>Position your face in the camera view</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-sm font-semibold">3</span>
                  <span>Select earring styles below to try them on</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-sm font-semibold">4</span>
                  <span>Move your head to see how they look from different angles</span>
                </li>
              </ol>
            </div>

            <div className="glass-strong rounded-xl p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-xl font-semibold mb-3 text-gold-400">✨ Features</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-gold-400">•</span>
                  <span>Real-time face tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-400">•</span>
                  <span>Instant earring try-on</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-400">•</span>
                  <span>No app installation needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-400">•</span>
                  <span>Privacy-first (all processing in browser)</span>
                </li>
              </ul>
            </div>
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

