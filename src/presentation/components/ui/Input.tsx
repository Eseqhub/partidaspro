'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">
        {label}
      </label>
      <div className="relative group">
        <input
          {...props}
          className={`w-full bg-white/5 border border-white/10 px-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-primary transition-all uppercase tracking-widest placeholder:text-white/10 ${
            error ? 'border-red-500/50' : ''
          } ${className}`}
        />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-primary/0 group-focus-within:bg-primary transition-all duration-500" />
      </div>
      {error && <span className="text-[9px] font-bold text-red-500/80 uppercase tracking-widest mt-1 ml-1">{error}</span>}
    </div>
  );
};
