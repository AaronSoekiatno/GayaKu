import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'glass' | 'glass-strong' | 'solid';
    onClick?: () => void;
}

export default function Card({ children, className = '', variant = 'glass', onClick }: CardProps) {
    const variantStyles = {
        glass: 'glass',
        'glass-strong': 'glass-strong',
        solid: 'bg-[var(--color-bg-card)] border border-purple-800/30'
    };

    return (
        <div className={`${variantStyles[variant]} rounded-xl p-6 ${className}`} onClick={onClick}>
            {children}
        </div>
    );
}
