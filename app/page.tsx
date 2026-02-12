'use client';

import { useState } from 'react';
import { IoColorPaletteOutline, IoScanOutline, IoSparklesOutline } from 'react-icons/io5';
import TryOnModal from '@/components/tryon/TryOnModal';
import Button from '@/components/ui/Button';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-12 flex items-center justify-between">
        <h1 className="text-3xl md:text-5xl font-bold gradient-text">GayaKu</h1>
      </header>

      {/* Hero Section */}
      <div className="flex-1 w-full px-4">
        <div className="mx-auto w-full max-w-5xl animate-fade-in pt-8 md:pt-12 pb-16 text-center">
          <h2 className="text-2xl md:text-6xl font-bold mb-6 gradient-text">
            Find Your Style Instantly
          </h2>
          <p className="text-xl text-gray-600 mb-8 mx-auto max-w-2xl">
            See how you look in different earring styles.
          </p>
          <Button
            size="md"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="text-lg px-10 py-2"
          >
            Try on virtually
          </Button>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="glass hover-lift rounded-xl p-12 min-h-[280px] overflow-hidden min-w-0 flex flex-col items-center">
              <IoColorPaletteOutline className="mx-auto h-8 w-8 text-gray-500" aria-hidden="true" />
              <h3 className="mt-7 text-lg font-semibold">Style Preferences</h3>
              <p className="mt-3 text-md text-gray-500 leading-relaxed break-words">
                Explore different earrings by your favorite brands, colors, and styles.
              </p>
            </div>
            <div className="glass hover-lift rounded-xl p-12 min-h-[280px] overflow-hidden min-w-0 flex flex-col items-center">
              <IoSparklesOutline className="mx-auto h-8 w-8 text-gray-500" aria-hidden="true" />
              <h3 className="mt-7 text-lg font-semibold">Virtual Try-On</h3>
              <p className="mt-3 text-md text-gray-500 leading-relaxed break-words">
                Experience a virtual try-on of earrings using our AR technology, ensuring you look good before you buy.
              </p>
            </div>
            <div className="glass hover-lift rounded-xl p-12 min-h-[280px] overflow-hidden min-w-0 flex flex-col items-center">
              <IoScanOutline className="mx-auto h-8 w-8 text-gray-500" aria-hidden="true" />
              <h3 className="mt-7 text-lg font-semibold">Smart Face Scan</h3>
              <p className="mt-3 text-md text-gray-500 leading-relaxed break-words">
                Our technology scans and analyzes your face shape to recommend and explain your best-fit earrings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Try-On Modal */}
      {isModalOpen && <TryOnModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
