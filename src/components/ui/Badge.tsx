import React from 'react';
import { ReminderStatusType } from '../../types/subscription';
import { CheckCircle2, Clock, AlertTriangle, Pause, XCircle } from 'lucide-react';

interface BadgeProps {
  type: ReminderStatusType | 'custom';
  label: string;
  isUrgent?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, label, isUrgent = false, className = '' }) => {
  let styleClasses = 'bg-[#18234F] text-[#60A5FA] border border-[#26336B]';
  let icon = <CheckCircle2 className="w-3.5 h-3.5" />;

  switch (type) {
    case 'active':
      // Blue badge + check-circle icon
      styleClasses = 'bg-[#2563EB]/15 text-[#60A5FA] border border-[#3B82F6]/40';
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6]" />;
      break;

    case 'renewing_soon':
      if (isUrgent) {
        // Due soon (< 3 days): pink badge + alert icon
        styleClasses = 'bg-[#EC4899]/15 text-[#F472B6] border border-[#EC4899]/40';
        icon = <AlertTriangle className="w-3.5 h-3.5 text-[#EC4899]" />;
      } else {
        // Renewing within 7 days: purple badge + clock icon
        styleClasses = 'bg-[#7C3AED]/20 text-[#A78BFA] border border-[#8B5CF6]/40';
        icon = <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />;
      }
      break;

    case 'due_today':
    case 'trial_ends_today':
    case 'trial_ending':
    case 'trial_ended':
      // Pink badge + alert icon
      styleClasses = 'bg-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/50 shadow-[0_0_10px_rgba(236,72,153,0.2)]';
      icon = <AlertTriangle className="w-3.5 h-3.5 text-[#EC4899]" />;
      break;

    case 'expired':
      // Expired / needs attention: pink outline badge (no fill) + alert icon
      styleClasses = 'bg-transparent text-[#F472B6] border border-[#EC4899]';
      icon = <AlertTriangle className="w-3.5 h-3.5 text-[#EC4899]" />;
      break;

    case 'paused':
      // Muted navy-blue badge (#26336B with #9AA6D6) + pause icon
      styleClasses = 'bg-[#18234F] text-[#9AA6D6] border border-[#26336B]';
      icon = <Pause className="w-3.5 h-3.5 text-[#9AA6D6]" />;
      break;

    case 'cancelled':
      // Muted navy-blue badge (#26336B with #9AA6D6) + x icon
      styleClasses = 'bg-[#111A40] text-[#9AA6D6] border border-[#26336B]';
      icon = <XCircle className="w-3.5 h-3.5 text-[#9AA6D6]" />;
      break;

    default:
      if (isUrgent) {
        styleClasses = 'bg-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/40';
        icon = <AlertTriangle className="w-3.5 h-3.5 text-[#EC4899]" />;
      } else {
        styleClasses = 'bg-[#2563EB]/15 text-[#60A5FA] border border-[#3B82F6]/30';
        icon = <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6]" />;
      }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium select-none ${styleClasses} ${className}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
