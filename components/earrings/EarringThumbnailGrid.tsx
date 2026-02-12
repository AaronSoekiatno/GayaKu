'use client';

import Image from 'next/image';
import { EarringStyle } from '@/lib/types';

interface EarringThumbnailGridProps {
    earrings: EarringStyle[];
    selectedEarring: EarringStyle | null;
    onSelectEarring: (earring: EarringStyle | null) => void;
}

export default function EarringThumbnailGrid({
    earrings,
    selectedEarring,
    onSelectEarring
}: EarringThumbnailGridProps) {
    return (
        <div className="grid grid-cols-4 gap-2">
            {earrings.map((earring) => {
                const isSelected = selectedEarring?.id === earring.id;

                return (
                    <button
                        key={earring.id}
                        onClick={() => onSelectEarring(earring)}
                        className={`
                            aspect-square rounded-md overflow-hidden relative
                            transition-all duration-200 cursor-pointer bg-black/5
                            ${isSelected
                                ? 'ring-2 ring-[#b8941f] border-2 border-[#b8941f] shadow-md shadow-[#b8941f]/20'
                                : 'border border-gray-200/50 opacity-70 hover:opacity-100'
                            }
                        `}
                    >
                        <Image
                            src={earring.imageSrc}
                            alt={earring.name}
                            fill
                            className="object-contain scale-[1.7]"
                            sizes="64px"
                        />
                    </button>
                );
            })}

            {/* None Card */}
            <button
                onClick={() => onSelectEarring(null)}
                className={`
                    aspect-square rounded-md overflow-hidden relative
                    transition-all duration-200 cursor-pointer
                    flex items-center justify-center
                    ${selectedEarring === null
                        ? 'ring-2 ring-[#b8941f] border-2 border-[#b8941f] shadow-md shadow-[#b8941f]/20 bg-gray-100'
                        : 'border border-gray-200/50 opacity-70 hover:opacity-100 bg-gray-50'
                    }
                `}
            >
                <span className="text-xs font-medium text-gray-600">None</span>
            </button>
        </div>
    );
}
