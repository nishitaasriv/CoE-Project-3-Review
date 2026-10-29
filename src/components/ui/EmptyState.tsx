import React from 'react';
import { Layers } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-[#111A40]/50 border border-[#26336B] border-dashed my-6">
      <div className="p-4 rounded-2xl bg-[#18234F] text-[#60A5FA] mb-4 border border-[#26336B]">
        {icon || <Layers className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-semibold text-[#F4F6FF] font-display">{title}</h3>
      <p className="text-sm text-[#9AA6D6] max-w-md mt-1 mb-5">{description}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {action}
        {secondaryAction}
      </div>
    </div>
  );
};
