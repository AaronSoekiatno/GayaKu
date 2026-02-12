'use client';

import { FaceShapeResult } from '@/lib/types';

const SHAPE_LABELS: Record<FaceShapeResult['shape'], string> = {
    oval: 'Oval',
    round: 'Round',
    square: 'Square',
    heart: 'Heart',
    oblong: 'Oblong',
    diamond: 'Diamond',
};

export default function FaceShapeResultPanel({ result }: { result: FaceShapeResult }) {
    return (
        <div className="p-4 animate-slide-up">
            <h3 className="text-lg font-semibold gradient-text font-[family-name:var(--font-display)]">
                {SHAPE_LABELS[result.shape]} Shape
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
                {Math.round(result.confidence * 100)}% confidence
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
                {result.description}
            </p>

            <div className="border-t border-gray-200/50 mt-4 mb-4" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Why Studs?
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
                {result.studTip}
            </p>
            <a
                href="https://www.diamondstuds.com/news/selecting-the-best-diamond-studs-for-your-face-shape"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-xs font-medium text-[#aa8c2c] hover:text-[#d4af37] transition-colors"
            >
                Learn more at Diamond Studs &rarr;
            </a>
        </div>
    );
}
