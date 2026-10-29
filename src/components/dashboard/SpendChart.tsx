import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { formatMoney } from '../../lib/currency';

interface MonthlySpendPoint {
  month: string;
  amount: number;
}

interface CategorySpendSlice {
  name: string;
  value: number;
}

interface SpendChartProps {
  monthlyData: MonthlySpendPoint[];
  categoryData: CategorySpendSlice[];
  baseCurrency: string;
}

// Section 10 strict chart series colors
const CHART_COLORS = [
  '#3B82F6', // Blue-500
  '#8B5CF6', // Purple-500
  '#93C5FD', // Blue-300
  '#A78BFA', // Purple-400
  '#F472B6', // Pink-400 (smallest slice)
];

export const SpendChart: React.FC<SpendChartProps> = ({
  monthlyData,
  categoryData,
  baseCurrency,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Bar Chart */}
      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#F4F6FF] font-display">
            Monthly Spend Trend
          </h3>
          <span className="text-xs text-[#9AA6D6]">Past 6 Months</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="month"
                stroke="#9AA6D6"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#26336B' }}
              />
              <YAxis
                stroke="#9AA6D6"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#26336B' }}
                tickFormatter={(val) => `${Math.round(val)}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as MonthlySpendPoint;
                    return (
                      <div className="rounded-xl bg-[#18234F] border border-[#26336B] p-2.5 shadow-xl text-xs">
                        <p className="font-semibold text-[#F4F6FF] mb-1">{data.month}</p>
                        <p className="text-[#60A5FA]">
                          {formatMoney(data.amount, baseCurrency)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {monthlyData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === monthlyData.length - 1 ? '#3B82F6' : '#2563EB'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Donut Chart */}
      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#F4F6FF] font-display">
            Spending by Category
          </h3>
          <span className="text-xs text-[#9AA6D6]">Active Subscriptions</span>
        </div>

        {categoryData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-[#9AA6D6]">
            No subscription categories to display.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`slice-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      stroke="#111A40"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as CategorySpendSlice;
                      return (
                        <div className="rounded-xl bg-[#18234F] border border-[#26336B] p-2.5 shadow-xl text-xs">
                          <p className="font-semibold text-[#F4F6FF] mb-1">{data.name}</p>
                          <p className="text-[#60A5FA]">
                            {formatMoney(data.value, baseCurrency)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  formatter={(val) => <span className="text-xs text-[#9AA6D6]">{val}</span>}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
