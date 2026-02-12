'use client';

import { EarringStyle } from '@/lib/types';

interface SelectedEarringInfoProps {
    earring: EarringStyle | null;
}

export default function SelectedEarringInfo({ earring }: SelectedEarringInfoProps) {
    if (!earring) {
        return (
            <div className="p-4 border-b border-gray-200/50">
                <h3 className="text-lg font-semibold gradient-text">Choose Your Style</h3>
                <p className="text-sm text-gray-500 mt-1">Select an earring to try on</p>
            </div>
        );
    }

    return (
        <div className="p-4 border-b border-gray-200/50">
            <h3 className="text-lg font-semibold gradient-text">{earring.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{earring.description}</p>
        </div>
    );
}
