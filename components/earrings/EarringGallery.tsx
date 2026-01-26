'use client';

import React from 'react';
import Image from 'next/image';
import { EarringStyle } from '@/lib/types';
import Card from '@/components/ui/Card';

interface EarringGalleryProps {
    earrings: EarringStyle[];
    selectedEarring: EarringStyle | null;
    onSelectEarring: (earring: EarringStyle) => void;
}

export default function EarringGallery({
    earrings,
    selectedEarring,
    onSelectEarring
}: EarringGalleryProps) {
    return (
        <div className="w-full animate-slide-in">
            <h3 className="text-2xl font-semibold mb-4 gradient-text">Choose Your Style</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {earrings.map((earring) => {
                    const isSelected = selectedEarring?.id === earring.id;

                    return (
                        <Card
                            key={earring.id}
                            variant="glass"
                            className={`
                cursor-pointer hover-lift transition-all duration-300
                ${isSelected ? 'ring-2 ring-gold-500 animate-glow' : 'opacity-80 hover:opacity-100'}
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
                                <h4 className="font-bold text-base mb-1 text-white">
                                    {earring.name}
                                </h4>
                                <p className="text-sm text-gold-400 capitalize font-medium">
                                    {earring.category}
                                </p>
                            </div>

                            {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-4 h-4 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
