'use client';

import React, { useEffect, useRef } from 'react';
import { FaceLandmarks, EarringCustomization } from '@/lib/types';
import { EarringStyle } from '@/lib/types';

interface EarringCanvasProps {
    videoElement: HTMLVideoElement | null;
    landmarks: FaceLandmarks | null;
    selectedEarrings: EarringStyle[];
    canvasWidth: number;
    canvasHeight: number;
    customization: EarringCustomization;
}

// Threshold for hiding earrings when face is turned too far
// At 0.5 yaw, the ear starts becoming occluded
const OCCLUSION_THRESHOLD = 0.45;

export default function EarringCanvas({
    videoElement,
    landmarks,
    selectedEarrings,
    canvasWidth,
    canvasHeight,
    customization
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

        // Calculate earring size based on scale factor and customization
        const baseSize = 80; // Base size in pixels
        const earringWidth = baseSize * (earring.scale || 1) * customization.scale;
        const earringHeight = earringWidth; // Keep aspect ratio square for now

        // Convert normalized coordinates (0-1) to canvas coordinates
        // Note: landmarks.x is already mirrored by MediaPipe for front camera
        const leftEarX = landmarks.leftEar.x * canvasWidth;
        const leftEarY = landmarks.leftEar.y * canvasHeight;
        const rightEarX = landmarks.rightEar.x * canvasWidth;
        const rightEarY = landmarks.rightEar.y * canvasHeight;

        // Calculate visibility based on face yaw
        // faceYaw: negative = looking left, positive = looking right
        const faceYaw = landmarks.faceYaw;

        // Show left earring when not looking too far left
        // When faceYaw < -OCCLUSION_THRESHOLD, left ear is occluded (head turned left)
        const showLeftEarring = faceYaw > -OCCLUSION_THRESHOLD;

        // Show right earring when not looking too far right
        // When faceYaw > OCCLUSION_THRESHOLD, right ear is occluded (head turned right)
        const showRightEarring = faceYaw < OCCLUSION_THRESHOLD;

        // Calculate opacity for smooth fade out near threshold
        const leftOpacity = showLeftEarring
            ? Math.min(1, (faceYaw + OCCLUSION_THRESHOLD) / 0.15)
            : 0;
        const rightOpacity = showRightEarring
            ? Math.min(1, (OCCLUSION_THRESHOLD - faceYaw) / 0.15)
            : 0;

        // Draw earring on left ear (if visible)
        if (leftOpacity > 0) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, leftOpacity));
            ctx.drawImage(
                earringImage,
                leftEarX - earringWidth / 2 + customization.offsetX,
                leftEarY + customization.offsetY,
                earringWidth,
                earringHeight
            );
            ctx.restore();
        }

        // Draw earring on right ear (if visible)
        if (rightOpacity > 0) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, rightOpacity));
            ctx.drawImage(
                earringImage,
                rightEarX - earringWidth / 2 - customization.offsetX, // Mirror X offset for right ear
                rightEarY + customization.offsetY,
                earringWidth,
                earringHeight
            );
            ctx.restore();
        }

    }, [landmarks, selectedEarrings, canvasWidth, canvasHeight, customization]);

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
