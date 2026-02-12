'use client';

import React from 'react';
import Image from 'next/image';
import { EarringStyle } from '@/lib/types';
import Card from '@/components/ui/Card';

interface EarringGalleryProps {
    earrings: EarringStyle[];
    selectedEarring: EarringStyle | null;
    onSelectEarring: (earring: EarringStyle | null) => void;
}

export default function EarringGallery({
    earrings,
    selectedEarring,
    onSelectEarring
}: EarringGalleryProps) {
    return (
        <div className="w-full animate-slide-in">
            <h3 className="text-2xl font-semibold mb-4 gradient-text">Choose Your Style</h3>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {earrings.map((earring) => {
                    const isSelected = selectedEarring?.id === earring.id;

                    return (
                        <Card
                            key={earring.id}
                            variant="glass"
                            className={`
                                cursor-pointer hover-lift transition-all duration-300 relative
                                ${isSelected 
                                    ? 'ring-4 ring-[#b8941f] border-4 border-[#b8941f] scale-105 shadow-lg shadow-[#b8941f]/30 z-10' 
                                    : 'opacity-80 hover:opacity-100'
                                }
                            `}
                            onClick={() => onSelectEarring(earring)}
                        >
                            <div className="aspect-square relative mb-3 bg-black/20 rounded-lg overflow-hidden">
                                <Image
                                    src={earring.imageSrc}
                                    alt={earring.name}
                                    fill
                                    className="object-contain p-2"
                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                                />
                            </div>

                            <div className="text-center">
                                <h4 className="font-bold text-base mb-1 text-gray-800">
                                    {earring.name}
                                </h4>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {earring.description}
                                </p>
                            </div>
                        </Card>
                    );
                })}

                {/* None Card - Last */}
                <Card
                    variant="glass"
                    className={`
                        cursor-pointer hover-lift transition-all duration-300 relative
                        ${selectedEarring === null 
                            ? 'ring-4 ring-[#b8941f] border-4 border-[#b8941f] scale-105 shadow-lg shadow-[#b8941f]/30 z-10' 
                            : 'opacity-80 hover:opacity-100'
                        }
                    `}
                    onClick={() => onSelectEarring(null)}
                >
                    <div className="aspect-square relative mb-3 bg-gray-200/30 rounded-lg overflow-hidden flex items-center justify-center">
                        <svg
                            className="w-12 h-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>

                    <div className="text-center">
                        <h4 className="font-bold text-base mb-1 text-gray-800">
                            None
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            Remove earrings
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
