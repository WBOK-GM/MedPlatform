import React from 'react';

type Variant = 'primary' | 'accent' | 'ghost' | 'danger';

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: Variant;
  full?: boolean;
  disabled?: boolean;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-brand-800 to-brand-700 text-white shadow-[0_8px_24px_rgba(60,32,82,0.28)] hover:shadow-[0_12px_30px_rgba(60,32,82,0.36)]',
  accent:
    'bg-gradient-to-r from-secondary-amber to-secondary-sand text-brand-900 shadow-[0_8px_24px_rgba(216,149,36,0.35)] hover:shadow-[0_12px_30px_rgba(216,149,36,0.45)]',
  ghost:
    'border border-brand-300/80 bg-white/75 text-brand-900 hover:bg-brand-300/25',
  danger:
    'bg-gradient-to-r from-[#9b2f2f] to-[#c53d3d] text-white shadow-[0_8px_20px_rgba(197,61,61,0.25)]',
};

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  full = false,
  disabled = false,
  className = '',
}: Props) {
  const baseClassName =
    'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold tracking-[0.01em] transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <button
      className={`${baseClassName} ${variantClasses[variant]} ${full ? 'w-full' : ''} ${className}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
