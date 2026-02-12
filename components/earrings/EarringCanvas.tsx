'use client';

import React, { useEffect, useRef } from 'react';
import { FaceLandmarks, EarringCustomization, HeadPose } from '@/lib/types';
import { EarringStyle } from '@/lib/types';

interface EarringCanvasProps {
    landmarks: FaceLandmarks | null;
    selectedEarrings: EarringStyle[];
    canvasWidth: number;
    canvasHeight: number;
    customization: EarringCustomization;
    fullHeight?: boolean;
}

// Size multiplier relative to inter-pupillary distance
const BASE_SIZE_MULTIPLIER = 0.7;

/**
 * Compute earring opacity based on multi-axis head pose.
 * Earrings fade out when the respective ear is turning away from the camera.
 */
function computeEarringOpacity(headPose: HeadPose, side: 'left' | 'right'): number {
    const { yaw, pitch } = headPose;

    // Hard cutoff: hide earring completely when ear is not visible
    // 'left' in image space = user's RIGHT ear (due to mirror display)
    // 'right' in image space = user's LEFT ear (due to mirror display)
    // When user turns right → yaw goes negative → hide user's right ear ('left' side)
    // When user turns left → yaw goes positive → hide user's left ear ('right' side)
    // Near-zero threshold so earrings hide as soon as the head starts turning.
    // Keep a tiny deadzone to avoid flicker from landmark noise while facing front.
    const THRESHOLD = 0.04; // ~2 degrees
    if (side === 'left' && yaw < -THRESHOLD) return 0;
    if (side === 'right' && yaw > THRESHOLD) return 0;

    // Hide at extreme pitch (looking steeply up/down)
    if (Math.abs(pitch) > 0.8) return 0;

    return 1;
}

/**
 * Draw an earring with canvas 2D transforms to simulate 3D perspective.
 */
function drawEarringWithTransform(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    headPose: HeadPose,
    opacity: number,
    offsetX: number,
    offsetY: number,
): void {
    if (opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

    // Move to earring anchor point (where it attaches to ear)
    const anchorX = x + offsetX;
    const anchorY = y + offsetY;
    ctx.translate(anchorX, anchorY);

    // Tilt earring to match head roll (sideways tilt)
    ctx.rotate(headPose.roll);

    // Subtle skew to show perspective when head is turned
    const skewFactor = Math.sin(headPose.yaw) * 0.4;
    ctx.transform(1, skewFactor, 0, 1, 0, 0);

    // Draw earring centered horizontally on anchor, hanging downward
    ctx.drawImage(image, -width / 2, 0, width, height);

    ctx.restore();
}

export default function EarringCanvas({
    landmarks,
    selectedEarrings,
    canvasWidth,
    canvasHeight,
    customization,
    fullHeight = false
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

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        const earring = selectedEarrings[0];
        const earringImage = earringImagesRef.current.get(earring.id);

        if (!earringImage || !earringImage.complete) return;

        // Dynamic sizing based on face scale (inter-pupillary distance)
        const earringWidth = landmarks.faceScale * canvasWidth * BASE_SIZE_MULTIPLIER
            * (earring.scale || 1) * customization.scale;
        // Use natural aspect ratio instead of forcing square
        const earringHeight = earringWidth * (earringImage.naturalHeight / earringImage.naturalWidth);

        // Convert normalized earlobe coords to canvas pixels
        const leftX = landmarks.leftEarLobe.x * canvasWidth;
        const leftY = landmarks.leftEarLobe.y * canvasHeight;
        const rightX = landmarks.rightEarLobe.x * canvasWidth;
        const rightY = landmarks.rightEarLobe.y * canvasHeight;

        // Compute opacity for each ear based on head pose
        const leftOpacity = computeEarringOpacity(landmarks.headPose, 'left');
        const rightOpacity = computeEarringOpacity(landmarks.headPose, 'right');

        // Draw left earring
        drawEarringWithTransform(
            ctx, earringImage,
            leftX, leftY,
            earringWidth, earringHeight,
            landmarks.headPose,
            leftOpacity,
            customization.leftOffsetX,
            customization.leftOffsetY,
        );

        // Draw right earring
        drawEarringWithTransform(
            ctx, earringImage,
            rightX, rightY,
            earringWidth, earringHeight,
            landmarks.headPose,
            rightOpacity,
            customization.rightOffsetX,
            customization.rightOffsetY,
        );

    }, [landmarks, selectedEarrings, canvasWidth, canvasHeight, customization]);

    return (
        <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{
                transform: 'scaleX(-1)', // Mirror to match video
                objectFit: 'cover', // Match video's object-fit so coordinates align
                ...(!fullHeight && { maxHeight: '80vh' }),
            }}
        />
    );
}
