'use client';

import React, { useEffect, useRef } from 'react';
import { FaceLandmarks } from '@/lib/types';
import { EarringStyle } from '@/lib/types';

interface EarringCanvasProps {
    videoElement: HTMLVideoElement | null;
    landmarks: FaceLandmarks | null;
    selectedEarrings: EarringStyle[];
    canvasWidth: number;
    canvasHeight: number;
}

export default function EarringCanvas({
    videoElement,
    landmarks,
    selectedEarrings,
    canvasWidth,
    canvasHeight
}: EarringCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const earringImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

    // Preload earring images
    useEffect(() => {
        selectedEarrings.forEach((earring) => {
            if (!earringImagesRef.current.has(earring.id)) {
                const img = new Image();
                img.src = earring.imageSrc;
                img.onload = () => {
                    earringImagesRef.current.set(earring.id, img);
                };
            }
        });
    }, [selectedEarrings]);

    // Render earrings on canvas
    useEffect(() => {
        if (!canvasRef.current || !landmarks || selectedEarrings.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Get the first selected earring (we'll support multiple later)
        const earring = selectedEarrings[0];
        const earringImage = earringImagesRef.current.get(earring.id);

        if (!earringImage || !earringImage.complete) return;

        // Calculate earring size based on scale factor
        const baseSize = 80; // Base size in pixels
        const earringWidth = baseSize * (earring.scale || 1);
        const earringHeight = earringWidth; // Keep aspect ratio square for now

        // Convert normalized coordinates (0-1) to canvas coordinates
        // Note: landmarks.x is already mirrored by MediaPipe for front camera
        const leftEarX = landmarks.leftEar.x * canvasWidth;
        const leftEarY = landmarks.leftEar.y * canvasHeight;
        const rightEarX = landmarks.rightEar.x * canvasWidth;
        const rightEarY = landmarks.rightEar.y * canvasHeight;

        // Draw earring on left ear
        ctx.save();
        ctx.drawImage(
            earringImage,
            leftEarX - earringWidth / 2,
            leftEarY - earringHeight / 4, // Offset slightly up from ear point
            earringWidth,
            earringHeight
        );
        ctx.restore();

        // Draw earring on right ear
        ctx.save();
        ctx.drawImage(
            earringImage,
            rightEarX - earringWidth / 2,
            rightEarY - earringHeight / 4,
            earringWidth,
            earringHeight
        );
        ctx.restore();

    }, [landmarks, selectedEarrings, canvasWidth, canvasHeight]);

    return (
        <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{
                transform: 'scaleX(-1)', // Mirror to match video
                maxHeight: '80vh',
            }}
        />
    );
}
