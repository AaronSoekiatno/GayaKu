import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}: ButtonProps) {
    const baseStyles =
        'cursor-pointer font-medium rounded-full transition-all duration-300 hover-lift disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-[#d4af37] text-white shadow-lg hover:shadow-xl hover:bg-[#aa8c2c]',
        secondary: 'bg-[#faf9f6] text-[#d4af37] border border-[#d4af37] shadow-lg hover:shadow-xl',
        outline: 'border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10'
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg'
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
