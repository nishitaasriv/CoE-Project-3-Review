import React from 'react';
import { formatMoney } from '../../lib/currency';

interface CategoryBarItem {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

interface CategoryBarsProps {
  categories: CategoryBarItem[];
  baseCurrency: string;
}

export const CategoryBars: React.FC<CategoryBarsProps> = ({ categories, baseCurrency }) => {
  if (categories.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[#111A40] border border-[#26336B] text-center text-xs text-[#9AA6D6]">
        No active category data.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#F4F6FF] font-display">
          Category Spending Breakdown
        </h3>
        <span className="text-xs text-[#9AA6D6]">Share of Monthly Total</span>
      </div>

      <div className="space-y-4">
        {categories.map((item) => (
          <div key={item.category}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#F4F6FF]">
                {item.category}{' '}
                <span className="font-normal text-[#9AA6D6]">({item.count} subs)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#60A5FA]">
                  {formatMoney(item.amount, baseCurrency)}
                </span>
                <span className="text-[#9AA6D6] w-9 text-right font-mono text-[11px]">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Gradient brand progress track */}
            <div className="h-2 w-full bg-[#26336B] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(3, item.percentage))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
