'use client';

import { FaceShapeResult } from '@/lib/types';
import { IoCloseOutline } from 'react-icons/io5';

interface FaceShapeResultPanelProps {
    result: FaceShapeResult;
    onClose: () => void;
}

const SHAPE_LABELS: Record<FaceShapeResult['shape'], string> = {
    oval: 'Oval',
    round: 'Round',
    square: 'Square',
    heart: 'Heart',
    oblong: 'Oblong',
    diamond: 'Diamond',
};

const SUITABILITY_STYLES: Record<string, string> = {
    excellent: 'bg-[#d4af37]/15 text-[#aa8c2c] border-[#d4af37]/30',
    good: 'bg-gray-100 text-gray-600 border-gray-200',
    avoid: 'bg-red-50 text-red-500 border-red-200',
};

const SUITABILITY_LABELS: Record<string, string> = {
    excellent: 'Best match',
    good: 'Good match',
    avoid: 'Not ideal',
};

export default function FaceShapeResultPanel({ result, onClose }: FaceShapeResultPanelProps) {
    return (
        <div className="absolute bottom-4 left-4 right-4 lg:right-auto lg:max-w-sm glass rounded-xl p-4 z-20 animate-slide-up">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                    <h3 className="text-lg font-semibold gradient-text font-[family-name:var(--font-display)]">
                        {SHAPE_LABELS[result.shape]} Shape
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {Math.round(result.confidence * 100)}% confidence
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-black/10 transition-colors cursor-pointer flex-shrink-0"
                    aria-label="Close analysis"
                >
                    <IoCloseOutline className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
                {result.description}
            </p>

            {/* Recommendations */}
            <div className="border-t border-gray-200/50 pt-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Earring Recommendations
                </p>
                <div className="space-y-2">
                    {result.recommendations.map((rec) => (
                        <div key={rec.category} className="flex items-start gap-2">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${SUITABILITY_STYLES[rec.suitability]}`}>
                                {SUITABILITY_LABELS[rec.suitability]}
                            </span>
                            <div className="min-w-0">
                                <span className="text-xs font-medium text-gray-800 capitalize">{rec.category}</span>
                                <span className="text-xs text-gray-500"> — {rec.reasoning}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
