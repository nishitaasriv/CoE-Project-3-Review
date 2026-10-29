import React from 'react';
import { NavLink } from 'react-router-dom';
import { Subscription } from '../../types/subscription';
import { getSubscriptionReminder } from '../../lib/reminders';
import { formatDate } from '../../lib/dates';
import { MoneyText } from '../currency/MoneyText';
import { Badge } from '../ui/Badge';
import { Clock, ExternalLink, Calendar, ChevronRight } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { downloadCalendarEvent } from '../../lib/ics';

interface ReminderRailProps {
  subscriptions: Subscription[];
}

export const ReminderRail: React.FC<ReminderRailProps> = ({ subscriptions }) => {
  const { settings } = useSettings();

  // Filter active/trial subscriptions renewing in the next 30 days
  const upcoming = subscriptions
    .filter((s) => s.status === 'active' || s.status === 'trial')
    .map((s) => ({
      sub: s,
      reminder: getSubscriptionReminder(s),
    }))
    .filter((item) => item.reminder.daysRemaining >= 0 && item.reminder.daysRemaining <= 30)
    .sort((a, b) => a.reminder.daysRemaining - b.reminder.daysRemaining);

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-[#3B82F6]" />
          <h3 className="text-sm font-semibold text-[#F4F6FF] font-display">
            Upcoming Renewals & Reminders
          </h3>
        </div>
        <p className="text-xs text-[#9AA6D6]">
          No subscriptions renewing in the next 30 days. You are all set!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#3B82F6]" />
          <h3 className="text-sm font-semibold text-[#F4F6FF] font-display">
            Upcoming Renewals (Next 30 Days)
          </h3>
        </div>
        <NavLink
          to="/subscriptions"
          className="text-xs font-semibold text-[#60A5FA] hover:underline flex items-center gap-0.5"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </NavLink>
      </div>

      <div className="divide-y divide-[#26336B]/60">
        {upcoming.map(({ sub, reminder }) => (
          <div
            key={sub.id}
            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#18234F] border border-[#26336B] flex items-center justify-center font-bold text-xs text-[#60A5FA] shrink-0">
                {sub.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F4F6FF] truncate font-display">
                  {sub.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#9AA6D6]">
                  <span>
                    {sub.isFreeTrial ? 'Trial ends' : 'Renews'}:{' '}
                    <strong className="text-[#F4F6FF]">
                      {formatDate(
                        sub.isFreeTrial && sub.trialEndDate ? sub.trialEndDate : sub.nextRenewalDate
                      )}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <div className="text-right">
                <MoneyText
                  amount={sub.price}
                  currency={sub.currency}
                  showConverted={true}
                  baseCurrency={settings.baseCurrency}
                  rates={settings.exchangeRates}
                  className="text-sm font-bold text-[#F4F6FF]"
                />
                <p className="text-[10px] text-[#9AA6D6]">{sub.billingCycle}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge type={reminder.type} label={reminder.label} isUrgent={reminder.isUrgent} />

                <button
                  onClick={() => downloadCalendarEvent(sub)}
                  title="Add to calendar"
                  className="p-1.5 rounded-lg bg-[#18234F] border border-[#26336B] text-[#9AA6D6] hover:text-[#3B82F6] hover:border-[#3B82F6]/50 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>

                {sub.cancellationUrl && (
                  <a
                    href={sub.cancellationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open cancellation page"
                    className="p-1.5 rounded-lg bg-[#18234F] border border-[#26336B] text-[#9AA6D6] hover:text-[#EC4899] hover:border-[#EC4899]/50"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
