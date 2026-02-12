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
        <div className="grid grid-cols-3 gap-3">
            {earrings.map((earring) => {
                const isSelected = selectedEarring?.id === earring.id;

                return (
                    <button
                        key={earring.id}
                        onClick={() => onSelectEarring(earring)}
                        className={`
                            aspect-square rounded-lg overflow-hidden relative
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
                            className="object-contain p-1"
                            sizes="80px"
                        />
                    </button>
                );
            })}

            {/* None Card */}
            <button
                onClick={() => onSelectEarring(null)}
                className={`
                    aspect-square rounded-lg overflow-hidden relative
                    transition-all duration-200 cursor-pointer
                    flex items-center justify-center
                    ${selectedEarring === null
                        ? 'ring-2 ring-[#b8941f] border-2 border-[#b8941f] shadow-md shadow-[#b8941f]/20 bg-gray-100'
                        : 'border border-gray-200/50 opacity-70 hover:opacity-100 bg-gray-50'
                    }
                `}
            >
                None
            </button>
        </div>
    );
}
