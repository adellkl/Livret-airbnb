'use client';

import { Home, Shield } from 'lucide-react';

interface AccountTypeSelectorProps {
  value: 'owner' | 'admin';
  onChange: (value: 'owner' | 'admin') => void;
  compact?: boolean;
}

export default function AccountTypeSelector({ value, onChange, compact = false }: AccountTypeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Type de compte"
      className={`${compact ? 'mb-5' : 'mb-7'} grid grid-cols-2 gap-1.5 rounded-[1.1rem] border border-[#1f2925]/7 bg-[#f7f4ef] p-1.5`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === 'owner'}
        onClick={() => onChange('owner')}
        className={`${compact ? 'px-2.5 py-2.5' : 'px-3 py-3'} rounded-[.85rem] border text-left transition-all duration-200 ${value === 'owner'
            ? 'border-[#d96c4a]/18 bg-white text-[#1f2925] shadow-[0_6px_18px_rgba(31,41,37,.07)]'
            : 'border-transparent text-[#7a817d] hover:bg-white/60 hover:text-[#1f2925]'
          }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`flex ${compact ? 'h-8 w-8' : 'h-9 w-9'} shrink-0 items-center justify-center rounded-[.7rem] ${value === 'owner' ? 'bg-[#fff0e8] text-[#d96c4a]' : 'bg-white text-[#8c938f]'}`}>
            <Home size={15} />
          </span>
          <span>
            <span className="block text-xs font-bold sm:text-sm">Propriétaire</span>
            <span className="mt-0.5 hidden text-[10px] opacity-60 sm:block">Gérer mes logements</span>
          </span>
        </div>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === 'admin'}
        onClick={() => onChange('admin')}
        className={`${compact ? 'px-2.5 py-2.5' : 'px-3 py-3'} rounded-[.85rem] border text-left transition-all duration-200 ${value === 'admin'
            ? 'border-[#d96c4a]/18 bg-white text-[#1f2925] shadow-[0_6px_18px_rgba(31,41,37,.07)]'
            : 'border-transparent text-[#7a817d] hover:bg-white/60 hover:text-[#1f2925]'
          }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`flex ${compact ? 'h-8 w-8' : 'h-9 w-9'} shrink-0 items-center justify-center rounded-[.7rem] ${value === 'admin' ? 'bg-[#fff0e8] text-[#d96c4a]' : 'bg-white text-[#8c938f]'}`}>
            <Shield size={15} />
          </span>
          <span>
            <span className="block text-xs font-bold sm:text-sm">Administrateur</span>
            <span className="mt-0.5 hidden text-[10px] opacity-60 sm:block">Accès plateforme</span>
          </span>
        </div>
      </button>
    </div>
  );
}
