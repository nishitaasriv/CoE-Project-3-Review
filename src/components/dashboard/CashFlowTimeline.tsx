import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Subscription } from '../../types/subscription';
import { useSettings } from '../../hooks/useSettings';
import { formatMoney } from '../../lib/currency';
import { formatDate } from '../../lib/dates';
import { buildCashFlow, CashFlowCell } from '../../lib/cashflow';
import {
  Calendar as CalendarIcon,
  AlertTriangle,
  ExternalLink,
  Info,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface CashFlowTimelineProps {
  subscriptions: Subscription[];
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const CashFlowTimeline: React.FC<CashFlowTimelineProps> = ({ subscriptions }) => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [activeCell, setActiveCell] = useState<CashFlowCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<CashFlowCell | null>(null);

  // Build the pure cash flow projection
  const cashFlow = useMemo(() => {
    return buildCashFlow(
      subscriptions,
      settings.exchangeRates,
      settings.baseCurrency,
      new Date(),
      90
    );
  }, [subscriptions, settings.exchangeRates, settings.baseCurrency]);

  const activeOrHovered = activeCell || hoveredCell;

  // Format short week start date: e.g. "29 Oct"
  const formatWeekDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' }).format(d);
  };

  const formatFullDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  };

  return (
    <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-5 shadow-lg select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#3B82F6]" />
            <h3 className="text-base font-bold text-[#F4F6FF] font-display">
              90-Day Cash-Flow Timeline & Heatmap
            </h3>
          </div>
          <p className="text-xs text-[#9AA6D6] mt-0.5">
            Exact daily and weekly projection of upcoming renewal charges
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-[#9AA6D6]">90-Day Forecast: </span>
          <span className="text-base font-extrabold text-[#60A5FA] font-display ml-1">
            {formatMoney(cashFlow.totalForecast, settings.baseCurrency)}
          </span>
        </div>
      </div>

      {/* Empty State if no charges in next 90 days */}
      {!cashFlow.hasChargesInWindow ? (
        <div className="p-8 rounded-xl bg-[#18234F]/40 border border-[#26336B] border-dashed text-center">
          <CalendarIcon className="w-8 h-8 text-[#9AA6D6] mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-[#F4F6FF]">No charges in the next 90 days</h4>
          <p className="text-xs text-[#9AA6D6] mt-1 max-w-sm mx-auto">
            You currently have no upcoming active subscriptions or trials due within the next 3
            months.
          </p>
        </div>
      ) : (
        <>
          {/* Main Grid Wrapper with Horizontal Scroll on Mobile */}
          <div className="overflow-x-auto pb-3">
            <div className="min-w-[700px]">
              {/* Secondary Markers Row (+30, +60, +90, Today) */}
              <div className="grid grid-cols-[2rem_repeat(13,1fr)] gap-1 mb-1 text-[11px] font-semibold text-[#60A5FA]">
                <div /> {/* Weekday column spacer */}
                {cashFlow.weeks.map((w) => (
                  <div key={w.weekIndex} className="text-center truncate">
                    {w.marker ? (
                      <span className="inline-block px-1 py-0.5 rounded bg-[#18234F] text-[#60A5FA] text-[10px] border border-[#26336B]">
                        {w.marker}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Month Labels Row */}
              <div className="grid grid-cols-[2rem_repeat(13,1fr)] gap-1 mb-1 text-[11px] text-[#9AA6D6] font-medium">
                <div />
                {cashFlow.weeks.map((w) => (
                  <div key={w.weekIndex} className="text-left pl-0.5 truncate text-[11px] font-semibold text-[#F4F6FF]">
                    {w.monthLabel || ''}
                  </div>
                ))}
              </div>

              {/* Column Week-Start Date Headers */}
              <div className="grid grid-cols-[2rem_repeat(13,1fr)] gap-1 mb-2 text-[10px] text-[#9AA6D6] font-mono">
                <div />
                {cashFlow.weeks.map((w) => (
                  <div key={w.weekIndex} className="text-center truncate">
                    {formatWeekDate(w.startDateStr)}
                  </div>
                ))}
              </div>

              {/* 7 Days Grid with Sticky Weekdays on Left */}
              <div className="space-y-1">
                {WEEKDAYS.map((dayLabel, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="grid grid-cols-[2rem_repeat(13,1fr)] gap-1 items-center"
                  >
                    {/* Weekday Label */}
                    <div className="sticky left-0 bg-[#111A40] z-10 text-[11px] font-bold text-[#9AA6D6] text-center w-6 py-1">
                      {dayLabel}
                    </div>

                    {/* 13 Week Cells for this Weekday */}
                    {Array.from({ length: 13 }).map((_, weekIdx) => {
                      const cellIndex = weekIdx * 7 + dayIndex;
                      const cell = cashFlow.cells[cellIndex];

                      if (!cell) {
                        return <div key={weekIdx} className="h-6 sm:h-7 rounded-md bg-transparent" />;
                      }

                      const isInactive = cell.isBeforeToday || cell.isAfterWindow;

                      if (isInactive) {
                        return (
                          <div
                            key={weekIdx}
                            className="h-6 sm:h-7 rounded-md bg-[#070B1F]/40 border border-[#26336B]/20"
                          />
                        );
                      }

                      // Determine cell styling
                      let cellClass = 'bg-[#18234F] hover:bg-[#202E66] border-[#26336B]/60';
                      if (cell.isPeak) {
                        // Peak day: pink-500 with soft pink glow
                        cellClass =
                          'bg-[#EC4899] text-white shadow-[0_0_12px_rgba(236,72,153,0.6)] border-[#F472B6]';
                      } else if (cell.isHigh) {
                        // High charge day: purple-500
                        cellClass = 'bg-[#8B5CF6] text-white border-[#A78BFA]/70';
                      } else if (cell.hasCharges) {
                        // Regular renewal: blue-500
                        cellClass = 'bg-[#3B82F6] text-white border-[#60A5FA]/70';
                      }

                      const isSelected = activeCell?.dateStr === cell.dateStr;
                      const todayRing = cell.isToday ? 'ring-1 ring-[#60A5FA]' : '';
                      const focusRing =
                        'focus:outline-none focus:ring-2 focus:ring-[#3B82F6] cursor-pointer';

                      const ariaLabel = `${formatFullDate(cell.dateStr)}, ${
                        cell.charges.length
                      } charge${cell.charges.length === 1 ? '' : 's'}, total ${formatMoney(
                        cell.totalAmount,
                        settings.baseCurrency
                      )}`;

                      return (
                        <button
                          key={weekIdx}
                          type="button"
                          tabIndex={cell.hasCharges ? 0 : -1}
                          aria-label={cell.hasCharges ? ariaLabel : undefined}
                          onClick={() => {
                            if (cell.hasCharges) {
                              setActiveCell(activeCell?.dateStr === cell.dateStr ? null : cell);
                            }
                          }}
                          onMouseEnter={() => setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`relative h-6 sm:h-7 rounded-md border flex items-center justify-center transition-all ${cellClass} ${todayRing} ${
                            cell.hasCharges ? focusRing : 'cursor-default'
                          } ${isSelected ? 'scale-110 z-20 ring-2 ring-white' : ''}`}
                        >
                          {/* Dot indicator if more than 1 charge */}
                          {cell.charges.length > 1 && (
                            <span
                              className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                                cell.isPeak ? 'bg-white' : 'bg-[#EC4899]'
                              }`}
                            />
                          )}

                          {/* Small trial tag indicator if any trial conversion */}
                          {cell.charges.some((c) => c.isTrialConversion) && (
                            <span className="absolute bottom-0.5 left-0.5 text-[8px] font-bold uppercase leading-none opacity-90">
                              T
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Weekly Totals Row */}
              <div className="grid grid-cols-[2rem_repeat(13,1fr)] gap-1 mt-2.5 pt-2 border-t border-[#26336B]/50 items-start">
                <div className="text-[10px] text-[#9AA6D6] font-semibold text-center">Wk</div>
                {cashFlow.weeks.map((w) => (
                  <div key={w.weekIndex} className="text-center">
                    <span
                      className={`text-[10px] font-mono block ${
                        w.isHeaviest
                          ? 'text-[#60A5FA] font-bold border-b border-[#60A5FA] pb-0.5'
                          : 'text-[#9AA6D6]'
                      }`}
                    >
                      {w.totalAmount > 0
                        ? formatMoney(w.totalAmount, settings.baseCurrency)
                        : '–'}
                    </span>
                    {w.isHeaviest && (
                      <span className="text-[9px] text-[#60A5FA] font-medium leading-tight block mt-0.5">
                        Heaviest
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tooltip & Popover for Active/Hovered Cell */}
          {activeOrHovered && activeOrHovered.hasCharges && (
            <div className="mt-4 p-4 rounded-xl bg-[#18234F] border border-[#3B82F6]/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#F4F6FF]">
                    {formatFullDate(activeOrHovered.dateStr)}
                  </span>
                  {activeOrHovered.isPeak && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EC4899] text-white">
                      PEAK DAY
                    </span>
                  )}
                  {activeOrHovered.isHigh && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B5CF6] text-white">
                      HIGH CHARGE DAY
                    </span>
                  )}
                </div>

                <div className="text-xs text-[#9AA6D6] space-y-1 pt-1">
                  {activeOrHovered.charges.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]" />
                      <span className="font-semibold text-[#F4F6FF]">{c.name}</span>
                      <span>–</span>
                      <span className="text-[#60A5FA]">
                        {formatMoney(c.amountInBase, settings.baseCurrency)}
                      </span>
                      {c.originalCurrency !== settings.baseCurrency && (
                        <span className="text-[11px] text-[#9AA6D6]">
                          ({formatMoney(c.originalAmount, c.originalCurrency)})
                        </span>
                      )}
                      {c.isTrialConversion && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/40">
                          trial
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 sm:text-right">
                <div>
                  <span className="text-xs text-[#9AA6D6] block">Day Total:</span>
                  <span className="text-base font-bold text-[#F4F6FF]">
                    {formatMoney(activeOrHovered.totalAmount, settings.baseCurrency)}
                  </span>
                </div>

                {activeOrHovered.charges.length === 1 ? (
                  <button
                    onClick={() =>
                      navigate(`/edit/${activeOrHovered.charges[0].subscriptionId}`)
                    }
                    className="p-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Plan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/subscriptions')}
                    className="p-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* One-Line Summary Row Below Grid */}
          <div className="mt-4 pt-3 border-t border-[#26336B]/60 flex flex-wrap items-center justify-between gap-y-2 text-xs text-[#9AA6D6]">
            <div>
              <span>Charges in window: </span>
              <strong className="text-[#F4F6FF]">{cashFlow.totalChargesCount}</strong>
            </div>

            <div>
              <span>Average per week: </span>
              <strong className="text-[#F4F6FF]">
                {formatMoney(cashFlow.averagePerWeek, settings.baseCurrency)}
              </strong>
            </div>

            {cashFlow.heaviestWeek && (
              <div>
                <span>Heaviest week: </span>
                <strong className="text-[#60A5FA]">
                  {formatWeekDate(cashFlow.heaviestWeek.startDateStr)} –{' '}
                  {formatWeekDate(cashFlow.heaviestWeek.endDateStr)} (
                  {formatMoney(cashFlow.heaviestWeek.totalAmount, settings.baseCurrency)})
                </strong>
              </div>
            )}

            {cashFlow.peakDay && (
              <div>
                <span>Peak day: </span>
                <strong className="text-[#F472B6]">
                  {formatWeekDate(cashFlow.peakDay.dateStr)} (
                  {formatMoney(cashFlow.peakDay.totalAmount, settings.baseCurrency)})
                </strong>
              </div>
            )}
          </div>

          {/* Monthly Breakdown Line */}
          {cashFlow.monthlyTotals.length > 0 && (
            <div className="mt-2 text-xs text-[#9AA6D6]">
              <span className="font-semibold text-[#F4F6FF]">Monthly Breakdown: </span>
              {cashFlow.monthlyTotals.map((m, idx) => (
                <span key={m.monthName}>
                  {idx > 0 && ' · '}
                  <span>{m.monthName} </span>
                  <strong className="text-[#60A5FA]">
                    {formatMoney(m.totalAmount, settings.baseCurrency)}
                  </strong>
                </span>
              ))}
            </div>
          )}

          {/* Legend with Exact Threshold Values */}
          <div className="mt-4 pt-3 border-t border-[#26336B]/60 flex flex-wrap items-center gap-4 text-[11px] text-[#9AA6D6]">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#18234F] border border-[#26336B]" />
              <span>No charge</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#3B82F6]" />
              <span>
                Regular renewal{' '}
                {cashFlow.thresholdHigh !== Infinity
                  ? `(up to ${formatMoney(cashFlow.thresholdHigh, settings.baseCurrency)})`
                  : ''}
              </span>
            </div>

            {cashFlow.thresholdHigh !== Infinity && (
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-[#8B5CF6]" />
                <span>
                  High charge day (above{' '}
                  {formatMoney(cashFlow.thresholdHigh, settings.baseCurrency)})
                </span>
              </div>
            )}

            {cashFlow.peakDay && (
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-[#EC4899] shadow-[0_0_8px_#EC4899]" />
                <span>
                  Single biggest charge (Peak) –{' '}
                  {formatMoney(cashFlow.peakDay.totalAmount, settings.baseCurrency)} on{' '}
                  {formatWeekDate(cashFlow.peakDay.dateStr)}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="relative w-3.5 h-3.5 rounded bg-[#3B82F6]">
                <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-[#EC4899]" />
              </span>
              <span>2+ charges on same day</span>
            </div>
          </div>

          {/* Footer Warning if Exchange Rate Missing */}
          {cashFlow.missingRatesCurrencies.length > 0 && (
            <div className="mt-3 p-2.5 rounded-xl bg-[#18234F] border border-[#EC4899]/50 flex items-center gap-2 text-xs text-[#F472B6]">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#EC4899]" />
              <span>
                Rate missing for {cashFlow.missingRatesCurrencies.join(', ')}. Charges in these
                currencies are excluded from the 90-day timeline.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
