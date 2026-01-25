import React from 'react';

export default function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-gold-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
        </div>
    );
}
