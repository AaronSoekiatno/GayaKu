'use client';

import { useEffect, useRef, useState } from 'react';
import { FaceLandmarks, EarringCustomization } from '@/lib/types';
import { PinchState } from '@/hooks/useHandTracking';

interface GestureOverlayProps {
    pinchState: PinchState;
    landmarks: FaceLandmarks | null;
    customization: EarringCustomization;
    onCustomizationChange: (customization: EarringCustomization) => void;
    canvasWidth: number;
    canvasHeight: number;
}

type DragTarget = 'left' | 'right' | null;

export default function GestureOverlay({
    pinchState,
    landmarks,
    customization,
    onCustomizationChange,
    canvasWidth,
    canvasHeight
}: GestureOverlayProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragTarget, setDragTarget] = useState<DragTarget>(null);
    const [dragStartOffset, setDragStartOffset] = useState<{ x: number; y: number } | null>(null);
    const [dragStartPinch, setDragStartPinch] = useState<{ x: number; y: number } | null>(null);

    // Smoothing for less jittery movement
    const smoothedOffsetRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!landmarks) return;

        if (pinchState.isPinching && pinchState.position) {
            // Convert pinch position to pixel coordinates (accounting for mirror)
            const pinchX = (1 - pinchState.position.x) * canvasWidth;
            const pinchY = pinchState.position.y * canvasHeight;

            if (!isDragging) {
                // Start dragging - determine which earring to adjust based on pinch position
                // Camera is mirrored, so pinching on right side of screen = left earring (user's left ear)
                const screenCenter = canvasWidth / 2;
                const target: DragTarget = pinchX < screenCenter ? 'right' : 'left';

                // Get current offset for the target earring
                const currentOffsetX = target === 'left' ? customization.leftOffsetX : customization.rightOffsetX;
                const currentOffsetY = target === 'left' ? customization.leftOffsetY : customization.rightOffsetY;

                setIsDragging(true);
                setDragTarget(target);
                setDragStartOffset({ x: currentOffsetX, y: currentOffsetY });
                setDragStartPinch({ x: pinchX, y: pinchY });
                smoothedOffsetRef.current = { x: currentOffsetX, y: currentOffsetY };
            } else if (dragStartPinch && dragStartOffset && dragTarget) {
                // Calculate how much the pinch has moved from start
                // Invert X because camera is mirrored - moving hand left should move earring right
                const deltaX = -(pinchX - dragStartPinch.x);
                const deltaY = pinchY - dragStartPinch.y;

                // Apply movement to offset (clamped to reasonable range)
                const targetX = Math.max(-100, Math.min(100, dragStartOffset.x + deltaX));
                const targetY = Math.max(-100, Math.min(100, dragStartOffset.y + deltaY));

                // Apply smoothing (lerp toward target)
                const smoothing = 0.4;
                smoothedOffsetRef.current.x += (targetX - smoothedOffsetRef.current.x) * smoothing;
                smoothedOffsetRef.current.y += (targetY - smoothedOffsetRef.current.y) * smoothing;

                // Only update if there's meaningful change
                const newOffsetX = Math.round(smoothedOffsetRef.current.x);
                const newOffsetY = Math.round(smoothedOffsetRef.current.y);

                // Update the appropriate earring's offset
                if (dragTarget === 'left') {
                    if (newOffsetX !== customization.leftOffsetX || newOffsetY !== customization.leftOffsetY) {
                        onCustomizationChange({
                            ...customization,
                            leftOffsetX: newOffsetX,
                            leftOffsetY: newOffsetY
                        });
                    }
                } else {
                    if (newOffsetX !== customization.rightOffsetX || newOffsetY !== customization.rightOffsetY) {
                        onCustomizationChange({
                            ...customization,
                            rightOffsetX: newOffsetX,
                            rightOffsetY: newOffsetY
                        });
                    }
                }
            }
        } else {
            // Pinch released
            if (isDragging) {
                setIsDragging(false);
                setDragTarget(null);
                setDragStartOffset(null);
                setDragStartPinch(null);
            }
        }
    }, [pinchState, landmarks, isDragging, dragTarget, dragStartPinch, dragStartOffset, customization, onCustomizationChange, canvasWidth, canvasHeight]);

    // Calculate display positions
    const pinchIndicatorPos = pinchState.position ? {
        x: (1 - pinchState.position.x) * canvasWidth,
        y: pinchState.position.y * canvasHeight
    } : null;

    // Get ear positions for visual guides
    const leftEarPos = landmarks ? {
        x: (1 - landmarks.leftEar.x) * canvasWidth,
        y: landmarks.leftEar.y * canvasHeight
    } : null;

    const rightEarPos = landmarks ? {
        x: (1 - landmarks.rightEar.x) * canvasWidth,
        y: landmarks.rightEar.y * canvasHeight
    } : null;

    // Current offsets for display
    const currentOffset = dragTarget === 'left'
        ? { x: customization.leftOffsetX, y: customization.leftOffsetY }
        : dragTarget === 'right'
        ? { x: customization.rightOffsetX, y: customization.rightOffsetY }
        : null;

    return (
        <div
            className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
            style={{ maxHeight: '80vh' }}
        >
            {/* Instructions when not pinching */}
            {!pinchState.isPinching && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 glass px-4 py-2 rounded-full">
                    <span className="text-sm text-gray-600">
                        Pinch near an ear to adjust that earring
                    </span>
                </div>
            )}

            {/* Side indicators when not dragging - swapped for mirrored camera */}
            {!isDragging && pinchState.isPinching && (
                <>
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 glass px-3 py-2 rounded-lg border-2 border-dashed border-white/30">
                        <span className="text-xs text-gray-500">Right ear</span>
                    </div>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 glass px-3 py-2 rounded-lg border-2 border-dashed border-white/30">
                        <span className="text-xs text-gray-500">Left ear</span>
                    </div>
                </>
            )}

            {/* Pinch indicator */}
            {pinchState.isPinching && pinchIndicatorPos && (
                <>
                    {/* Main pinch cursor */}
                    <div
                        className={`absolute w-10 h-10 rounded-full border-4 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ${
                            isDragging
                                ? 'border-[#d4af37] bg-[#d4af37]/30 scale-110'
                                : 'border-white/70 bg-white/20'
                        }`}
                        style={{
                            left: pinchIndicatorPos.x,
                            top: pinchIndicatorPos.y
                        }}
                    >
                        {/* Inner dot */}
                        <div className={`absolute inset-0 m-auto w-2 h-2 rounded-full ${
                            isDragging ? 'bg-[#d4af37]' : 'bg-white/70'
                        }`} />
                    </div>

                    {/* Guide line to the target earring when dragging */}
                    {isDragging && dragTarget && (
                        <svg className="absolute inset-0 w-full h-full">
                            {dragTarget === 'left' && leftEarPos && (
                                <line
                                    x1={pinchIndicatorPos.x}
                                    y1={pinchIndicatorPos.y}
                                    x2={leftEarPos.x + customization.leftOffsetX}
                                    y2={leftEarPos.y + customization.leftOffsetY}
                                    stroke="#d4af37"
                                    strokeWidth="2"
                                    strokeDasharray="4 4"
                                    opacity="0.6"
                                />
                            )}
                            {dragTarget === 'right' && rightEarPos && (
                                <line
                                    x1={pinchIndicatorPos.x}
                                    y1={pinchIndicatorPos.y}
                                    x2={rightEarPos.x + customization.rightOffsetX}
                                    y2={rightEarPos.y + customization.rightOffsetY}
                                    stroke="#d4af37"
                                    strokeWidth="2"
                                    strokeDasharray="4 4"
                                    opacity="0.6"
                                />
                            )}
                        </svg>
                    )}
                </>
            )}

            {/* Active drag status */}
            {isDragging && dragTarget && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 glass px-4 py-2 rounded-full border border-[#d4af37]/50">
                    <span className="text-sm text-[#d4af37] font-medium">
                        Adjusting {dragTarget} earring
                    </span>
                </div>
            )}

            {/* Position indicator */}
            {isDragging && currentOffset && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 glass px-3 py-1 rounded-full">
                    <span className="text-xs text-gray-500">
                        {dragTarget}: X {currentOffset.x > 0 ? '+' : ''}{currentOffset.x} · Y {currentOffset.y > 0 ? '+' : ''}{currentOffset.y}
                    </span>
                </div>
            )}
        </div>
    );
}
