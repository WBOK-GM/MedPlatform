import React from 'react';

interface Props {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function Input({ label, name, type = 'text', value, onChange, placeholder, required, disabled = false }: Props) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80" htmlFor={name}>{label}</label>
      <input
        className="w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 placeholder:text-secondary-gray focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35 disabled:cursor-not-allowed disabled:opacity-70"
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}
