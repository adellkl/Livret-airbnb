import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

export default function StatCard({ icon: Icon, title, value, trend, trendUp }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[1.5rem] border border-[#e8e1da] bg-white p-4 shadow-[0_12px_30px_rgba(31,41,37,.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(31,41,37,.12)] sm:p-5">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#fff1ea] opacity-70 transition-transform duration-500 group-hover:scale-125" />
      <div className="relative mb-6 flex items-start justify-between gap-2">
        <div className="rounded-2xl bg-[#fff1ea] p-2.5 ring-1 ring-[#efcbbd]">
          <Icon size={19} className="text-primary" />
        </div>
        {trend && (
          <span className={`max-w-[8rem] rounded-full px-2.5 py-1 text-right text-[9px] font-bold leading-3 sm:text-[10px] ${trendUp ? 'bg-[#eaf5f1] text-[#397d6d]' : 'bg-[#f9ece9] text-[#b14e39]'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="relative mb-1 text-3xl font-semibold tracking-[-0.05em] text-[#1f2925]">{value}</p>
      <p className="relative text-xs font-medium leading-5 text-[#69716d] sm:text-sm">{title}</p>
    </div>
  );
}
