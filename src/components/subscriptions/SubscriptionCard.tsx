import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Subscription } from '../../types/subscription';
import { Badge } from '../ui/Badge';
import { MoneyText } from '../currency/MoneyText';
import { getSubscriptionReminder } from '../../lib/reminders';
import { formatDate } from '../../lib/dates';
import { downloadCalendarEvent } from '../../lib/ics';
import { useSettings } from '../../hooks/useSettings';
import {
  Calendar,
  ExternalLink,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  Pause,
  Play,
  TrendingUp,
  Users,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface SubscriptionCardProps {
  subscription: Subscription;
  onDelete: (id: string) => void;
  onCancel: (id: string) => void;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onShowAlternatives?: (sub: Subscription) => void;
  onShowProofVault?: (sub: Subscription) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onDelete,
  onCancel,
  onPause,
  onResume,
  onShowAlternatives,
  onShowProofVault,
}) => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [showMenu, setShowMenu] = useState(false);

  const reminder = getSubscriptionReminder(subscription);
  const isCancelled = subscription.status === 'cancelled';
  const isPaused = subscription.status === 'paused';

  // Calculate if price has hiked since initial entry
  let hasPriceHike = false;
  let priceDiff = 0;
  if (subscription.priceHistory && subscription.priceHistory.length > 1) {
    const first = subscription.priceHistory[0].price;
    if (subscription.price > first) {
      hasPriceHike = true;
      priceDiff = subscription.price - first;
    }
  }

  return (
    <div
      className={`relative rounded-2xl bg-[#111A40] border transition-all duration-200 p-5 group flex flex-col justify-between ${
        reminder.isUrgent
          ? 'border-[#EC4899]/50 shadow-[0_0_15px_rgba(236,72,153,0.15)]'
          : 'border-[#26336B] hover:border-[#3B82F6]/50 hover:bg-[#18234F]/70 hover:shadow-xl'
      }`}
    >
      {/* Top row: Avatar, Name, Status Badge, More menu */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Letter avatar adhering strictly to Blue/Purple theme */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] flex items-center justify-center font-bold text-white text-base shrink-0 shadow-md">
              {subscription.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3
                className={`font-semibold text-base truncate font-display ${
                  isCancelled ? 'line-through text-[#9AA6D6]' : 'text-[#F4F6FF]'
                }`}
              >
                {subscription.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-[#9AA6D6]">{subscription.category}</span>
                {subscription.splitCount > 1 && (
                  <span className="flex items-center gap-1 text-[11px] text-[#60A5FA] bg-[#18234F] px-1.5 py-0.5 rounded-md border border-[#26336B]">
                    <Users className="w-3 h-3" />
                    <span>Split ({subscription.splitCount}p)</span>
                  </span>
                )}
                {subscription.isSeasonal && (
                  <span className="text-[10px] text-[#A78BFA] bg-[#7C3AED]/20 px-1.5 py-0.5 rounded border border-[#8B5CF6]/30">
                    Seasonal
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Badge type={reminder.type} label={reminder.label} isUrgent={reminder.isUrgent} />

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg text-[#9AA6D6] hover:text-[#F4F6FF] hover:bg-[#18234F] cursor-pointer"
                aria-label="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-[#18234F] border border-[#26336B] shadow-2xl p-1 z-30 divide-y divide-[#26336B]/50 animate-fade-in text-xs">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          navigate(`/edit/${subscription.id}`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#F4F6FF] hover:bg-[#202E66] cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#60A5FA]" />
                        <span>Edit Details</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowMenu(false);
                          downloadCalendarEvent(subscription);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#F4F6FF] hover:bg-[#202E66] cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span>Add to Calendar (.ics)</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowMenu(false);
                          navigate(`/cancellation?subId=${subscription.id}`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#F4F6FF] hover:bg-[#202E66] cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5 text-[#F472B6]" />
                        <span>Cancel Assistant</span>
                      </button>
                    </div>

                    <div className="py-1">
                      {isPaused ? (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            if (onResume) onResume(subscription.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#60A5FA] hover:bg-[#202E66] cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume Subscription</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            if (onPause) onPause(subscription.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#9AA6D6] hover:bg-[#202E66] cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause Subscription</span>
                        </button>
                      )}

                      {!isCancelled && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onCancel(subscription.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#EC4899] hover:bg-[#EC4899]/15 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Mark as Cancelled</span>
                        </button>
                      )}

                      {isCancelled && onShowProofVault && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onShowProofVault(subscription);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#60A5FA] hover:bg-[#202E66] cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Proof Vault</span>
                        </button>
                      )}

                      {onShowAlternatives && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onShowAlternatives(subscription);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#A78BFA] hover:bg-[#202E66] cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>View Savings Tips</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete(subscription.id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#EC4899] hover:bg-[#EC4899]/15 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Permanently</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pricing line with base currency conversion */}
        <div className="my-3">
          <div className="flex items-baseline gap-1">
            <MoneyText
              amount={subscription.price}
              currency={subscription.currency}
              showConverted={true}
              baseCurrency={settings.baseCurrency}
              rates={settings.exchangeRates}
              className="text-xl font-bold text-[#F4F6FF] font-display"
            />
            <span className="text-xs text-[#9AA6D6] font-medium">
              / {subscription.billingCycle.toLowerCase()}
            </span>
          </div>

          {subscription.splitCount > 1 && (
            <p className="text-[11px] text-[#60A5FA] mt-0.5">
              My share:{' '}
              <MoneyText
                amount={subscription.price / subscription.splitCount}
                currency={subscription.currency}
                showConverted={true}
                baseCurrency={settings.baseCurrency}
                rates={settings.exchangeRates}
                className="font-medium"
              />
            </p>
          )}

          {hasPriceHike && (
            <div className="flex items-center gap-1 text-[11px] text-[#F472B6] mt-1">
              <TrendingUp className="w-3 h-3 text-[#EC4899]" />
              <span>Hiked by +{subscription.currency} {priceDiff} since signup</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Renewal date, direct links */}
      <div className="pt-3 border-t border-[#26336B]/60 flex items-center justify-between text-xs text-[#9AA6D6]">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>
            {subscription.isFreeTrial ? 'Trial ends:' : 'Renews:'}{' '}
            <strong className="text-[#F4F6FF]">
              {formatDate(
                subscription.isFreeTrial && subscription.trialEndDate
                  ? subscription.trialEndDate
                  : subscription.nextRenewalDate
              )}
            </strong>
          </span>
        </div>

        {subscription.cancellationUrl && (
          <a
            href={subscription.cancellationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#60A5FA] hover:text-[#93C5FD] hover:underline"
          >
            <span>Cancel Site</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
