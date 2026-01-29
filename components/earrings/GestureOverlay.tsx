'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
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

// How close the pinch needs to be to an earring to start dragging (in pixels)
const GRAB_RADIUS = 60;

export default function GestureOverlay({
    pinchState,
    landmarks,
    customization,
    onCustomizationChange,
    canvasWidth,
    canvasHeight
}: GestureOverlayProps) {
    const [dragTarget, setDragTarget] = useState<DragTarget>(null);
    const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
    const [dragStartCustomization, setDragStartCustomization] = useState<EarringCustomization | null>(null);

    // Calculate earring positions in pixel coordinates
    const getEarringPositions = useCallback(() => {
        if (!landmarks) return { left: null, right: null };

        // Account for mirror transform - swap left/right for display
        const leftX = (1 - landmarks.leftEar.x) * canvasWidth + customization.offsetX;
        const leftY = landmarks.leftEar.y * canvasHeight + customization.offsetY;
        const rightX = (1 - landmarks.rightEar.x) * canvasWidth - customization.offsetX;
        const rightY = landmarks.rightEar.y * canvasHeight + customization.offsetY;

        return {
            left: { x: leftX, y: leftY },
            right: { x: rightX, y: rightY }
        };
    }, [landmarks, customization, canvasWidth, canvasHeight]);

    // Handle pinch state changes
    useEffect(() => {
        if (!pinchState.isPinching || !pinchState.position) {
            // Pinch released - stop dragging
            if (dragTarget) {
                setDragTarget(null);
                setDragStartPos(null);
                setDragStartCustomization(null);
            }
            return;
        }

        // Convert pinch position to pixel coordinates (accounting for mirror)
        const pinchX = (1 - pinchState.position.x) * canvasWidth;
        const pinchY = pinchState.position.y * canvasHeight;

        if (!dragTarget) {
            // Not currently dragging - check if we should start
            const earringPositions = getEarringPositions();

            if (earringPositions.left) {
                const distToLeft = Math.sqrt(
                    Math.pow(pinchX - earringPositions.left.x, 2) +
                    Math.pow(pinchY - earringPositions.left.y, 2)
                );

                if (distToLeft < GRAB_RADIUS) {
                    setDragTarget('left');
                    setDragStartPos({ x: pinchX, y: pinchY });
                    setDragStartCustomization({ ...customization });
                    return;
                }
            }

            if (earringPositions.right) {
                const distToRight = Math.sqrt(
                    Math.pow(pinchX - earringPositions.right.x, 2) +
                    Math.pow(pinchY - earringPositions.right.y, 2)
                );

                if (distToRight < GRAB_RADIUS) {
                    setDragTarget('right');
                    setDragStartPos({ x: pinchX, y: pinchY });
                    setDragStartCustomization({ ...customization });
                    return;
                }
            }
        } else if (dragStartPos && dragStartCustomization) {
            // Currently dragging - update position
            const deltaX = pinchX - dragStartPos.x;
            const deltaY = pinchY - dragStartPos.y;

            // Apply delta to customization (X is mirrored for left earring)
            const newOffsetX = Math.max(-50, Math.min(50,
                dragStartCustomization.offsetX + (dragTarget === 'left' ? deltaX : -deltaX)
            ));
            const newOffsetY = Math.max(-50, Math.min(50,
                dragStartCustomization.offsetY + deltaY
            ));

            if (newOffsetX !== customization.offsetX || newOffsetY !== customization.offsetY) {
                onCustomizationChange({
                    ...customization,
                    offsetX: newOffsetX,
                    offsetY: newOffsetY
                });
            }
        }
    }, [pinchState, dragTarget, dragStartPos, dragStartCustomization, customization, onCustomizationChange, canvasWidth, canvasHeight, getEarringPositions]);

    // Calculate pinch indicator position (in CSS pixels, accounting for mirror)
    const pinchIndicatorPos = pinchState.position ? {
        x: (1 - pinchState.position.x) * canvasWidth,
        y: pinchState.position.y * canvasHeight
    } : null;

    const earringPositions = getEarringPositions();

    return (
        <div
            className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
            style={{ maxHeight: '80vh' }}
        >
            {/* Pinch indicator */}
            {pinchState.isPinching && pinchIndicatorPos && (
                <div
                    className={`absolute w-8 h-8 rounded-full border-4 transform -translate-x-1/2 -translate-y-1/2 transition-colors ${
                        dragTarget
                            ? 'border-[#d4af37] bg-[#d4af37]/30 scale-125'
                            : 'border-white/70 bg-white/20'
                    }`}
                    style={{
                        left: pinchIndicatorPos.x,
                        top: pinchIndicatorPos.y
                    }}
                />
            )}

            {/* Earring grab zones (visible when pinching but not dragging) */}
            {pinchState.isPinching && !dragTarget && (
                <>
                    {earringPositions.left && (
                        <div
                            className="absolute w-16 h-16 rounded-full border-2 border-dashed border-white/40 transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                                left: earringPositions.left.x,
                                top: earringPositions.left.y
                            }}
                        />
                    )}
                    {earringPositions.right && (
                        <div
                            className="absolute w-16 h-16 rounded-full border-2 border-dashed border-white/40 transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                                left: earringPositions.right.x,
                                top: earringPositions.right.y
                            }}
                        />
                    )}
                </>
            )}

            {/* Active drag indicator */}
            {dragTarget && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 glass px-4 py-2 rounded-full">
                    <span className="text-sm text-[#d4af37] font-medium">
                        Adjusting {dragTarget} earring
                    </span>
                </div>
            )}
        </div>
    );
}
