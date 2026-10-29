import React from 'react';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  isUrgent?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  isUrgent = false,
}) => {
  return (
    <div
      className={`rounded-2xl bg-[#111A40] border p-5 relative overflow-hidden transition-all duration-200 ${
        isUrgent
          ? 'border-[#EC4899]/60 shadow-[0_0_20px_rgba(236,72,153,0.15)]'
          : 'border-[#26336B] hover:border-[#3B82F6]/50 shadow-lg'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#9AA6D6]">
          {title}
        </span>
        <div className="p-2 rounded-xl bg-[#18234F] border border-[#26336B] text-[#60A5FA]">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#F4F6FF]">
          {value}
        </div>
        {badge}
      </div>

      {subtitle && <div className="mt-2 text-xs text-[#9AA6D6]">{subtitle}</div>}
    </div>
  );
};
