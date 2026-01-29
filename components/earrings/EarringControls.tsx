'use client';

import React from 'react';
import { EarringCustomization } from '@/lib/types';

interface EarringControlsProps {
    customization: EarringCustomization;
    onChange: (customization: EarringCustomization) => void;
    onReset: () => void;
}

export default function EarringControls({ customization, onChange, onReset }: EarringControlsProps) {
    const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...customization, scale: parseFloat(e.target.value) });
    };

    const handleOffsetXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...customization, offsetX: parseInt(e.target.value) });
    };

    const handleOffsetYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...customization, offsetY: parseInt(e.target.value) });
    };

    return (
        <div className="glass rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Adjust Fit</h3>
                <button
                    onClick={onReset}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                    Reset
                </button>
            </div>

            {/* Scale Control */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                    <label htmlFor="scale-slider">Size</label>
                    <span>{Math.round(customization.scale * 100)}%</span>
                </div>
                <input
                    id="scale-slider"
                    type="range"
                    min="0.3"
                    max="2"
                    step="0.1"
                    value={customization.scale}
                    onChange={handleScaleChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                />
            </div>

            {/* Horizontal Offset Control */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                    <label htmlFor="offsetX-slider">Horizontal</label>
                    <span>{customization.offsetX > 0 ? '+' : ''}{customization.offsetX}px</span>
                </div>
                <input
                    id="offsetX-slider"
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={customization.offsetX}
                    onChange={handleOffsetXChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                />
            </div>

            {/* Vertical Offset Control */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                    <label htmlFor="offsetY-slider">Vertical</label>
                    <span>{customization.offsetY > 0 ? '+' : ''}{customization.offsetY}px</span>
                </div>
                <input
                    id="offsetY-slider"
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={customization.offsetY}
                    onChange={handleOffsetYChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                />
                <p className="text-xs text-gray-400 mt-1">Move down toward earlobe</p>
            </div>
        </div>
    );
}
