import React from 'react';
import { NavLink } from 'react-router-dom';
import { formatMoney } from '../../lib/currency';
import { AlertTriangle, CheckCircle2, SlidersHorizontal } from 'lucide-react';

interface BudgetAlertCardProps {
  currentMonthly: number;
  monthlyBudget: number;
  baseCurrency: string;
}

export const BudgetAlertCard: React.FC<BudgetAlertCardProps> = ({
  currentMonthly,
  monthlyBudget,
  baseCurrency,
}) => {
  const isBudgetSet = monthlyBudget > 0;
  const ratio = isBudgetSet ? (currentMonthly / monthlyBudget) * 100 : 0;
  const isOverBudget = isBudgetSet && currentMonthly > monthlyBudget;
  const remaining = Math.max(0, monthlyBudget - currentMonthly);
  const overage = Math.max(0, currentMonthly - monthlyBudget);

  return (
    <div
      className={`rounded-2xl bg-[#111A40] border p-5 shadow-lg relative overflow-hidden ${
        isOverBudget
          ? 'border-[#EC4899]/60 shadow-[0_0_20px_rgba(236,72,153,0.15)]'
          : 'border-[#26336B]'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#F4F6FF] font-display">
          Monthly Budget Tracker
        </h3>
        {isOverBudget ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/50">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Over Budget by {formatMoney(overage, baseCurrency)}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2563EB]/15 text-[#60A5FA] border border-[#3B82F6]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Within Budget</span>
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between my-2">
        <div>
          <span className="text-2xl font-bold font-display text-[#F4F6FF]">
            {formatMoney(currentMonthly, baseCurrency)}
          </span>
          <span className="text-xs text-[#9AA6D6] ml-1.5">
            / {formatMoney(monthlyBudget, baseCurrency)} cap
          </span>
        </div>
        <span className="text-xs font-mono font-semibold text-[#60A5FA]">
          {ratio.toFixed(0)}%
        </span>
      </div>

      {/* Progress track */}
      <div className="h-2.5 w-full bg-[#18234F] rounded-full overflow-hidden my-3 border border-[#26336B]/60">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOverBudget
              ? 'bg-[#EC4899]'
              : 'bg-gradient-to-r from-[#7C3AED] to-[#3B82F6]'
          }`}
          style={{ width: `${Math.min(100, ratio)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-[#9AA6D6] pt-1">
        <span>
          {isOverBudget
            ? `Exceeded budget limit by ${formatMoney(overage, baseCurrency)}`
            : `${formatMoney(remaining, baseCurrency)} remaining this month`}
        </span>
        <NavLink
          to="/settings"
          className="text-[#60A5FA] hover:underline flex items-center gap-1"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>Adjust</span>
        </NavLink>
      </div>
    </div>
  );
};
