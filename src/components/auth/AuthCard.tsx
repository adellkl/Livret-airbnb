import { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
  wide?: boolean;
  compact?: boolean;
}

export default function AuthCard({ children, wide = false, compact = false }: AuthCardProps) {
  return (
    <div className={`relative w-full overflow-hidden rounded-[1.75rem] border border-[#1f2925]/8 bg-white shadow-[0_24px_70px_rgba(31,41,37,.08)] ${
      compact ? 'p-5 sm:p-7' : 'p-5 sm:p-8'
    } ${wide ? 'max-w-[680px]' : 'max-w-[560px]'}`}>
      <span className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#d96c4a]/55 to-transparent" />
      {children}
    </div>
  );
}
