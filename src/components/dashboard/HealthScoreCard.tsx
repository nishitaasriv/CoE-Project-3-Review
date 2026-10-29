import React from 'react';
import { Activity, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface HealthScoreCardProps {
  score: number;
  tips: string[];
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ score, tips }) => {
  let scoreColor = 'text-[#3B82F6]'; // Blue
  let barGradient = 'from-[#7C3AED] to-[#3B82F6]';
  let badgeLabel = 'Healthy';

  if (score < 50) {
    scoreColor = 'text-[#F472B6]'; // Pink accent
    barGradient = 'from-[#EC4899] to-[#8B5CF6]';
    badgeLabel = 'Needs Attention';
  } else if (score < 75) {
    scoreColor = 'text-[#A78BFA]'; // Purple
    barGradient = 'from-[#8B5CF6] to-[#3B82F6]';
    badgeLabel = 'Moderate';
  }

  return (
    <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-5 shadow-lg relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#8B5CF6]" />
          <h3 className="text-sm font-semibold text-[#F4F6FF] font-display">
            Subscription Health Score
          </h3>
        </div>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
            score < 50
              ? 'bg-[#EC4899]/20 text-[#F472B6] border-[#EC4899]/50'
              : 'bg-[#2563EB]/20 text-[#60A5FA] border-[#3B82F6]/40'
          }`}
        >
          {badgeLabel}
        </span>
      </div>

      <div className="flex items-baseline gap-2 my-2">
        <span className={`text-3xl font-extrabold font-display ${scoreColor}`}>
          {score}
        </span>
        <span className="text-xs text-[#9AA6D6]">/ 100</span>
      </div>

      <div className="h-2 w-full bg-[#18234F] rounded-full overflow-hidden my-3 border border-[#26336B]/60">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>

      {tips.length > 0 && (
        <div className="space-y-1.5 mt-3 pt-3 border-t border-[#26336B]/50">
          {tips.slice(0, 2).map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-[#9AA6D6]">
              <Sparkles className="w-3.5 h-3.5 text-[#A78BFA] shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
