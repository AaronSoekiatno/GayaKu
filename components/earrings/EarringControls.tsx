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

        </div>
    );
}
