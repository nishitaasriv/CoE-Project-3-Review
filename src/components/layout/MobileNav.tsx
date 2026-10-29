import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  PlusCircle,
  Ban,
  Settings,
} from 'lucide-react';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { getSubscriptionReminder } from '../../lib/reminders';

export const MobileNav: React.FC = () => {
  const { subscriptions } = useSubscriptions();

  const urgentCount = subscriptions.filter((s) => {
    if (s.status !== 'active' && s.status !== 'trial') return false;
    const r = getSubscriptionReminder(s);
    return r.isUrgent;
  }).length;

  const items = [
    {
      to: '/dashboard',
      label: 'Home',
      icon: <LayoutDashboard className="w-5 h-5" />,
      hasBadge: urgentCount > 0,
    },
    {
      to: '/subscriptions',
      label: 'My Subs',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      to: '/add',
      label: 'Add',
      icon: <PlusCircle className="w-6 h-6 text-[#3B82F6]" />,
      isAction: true,
    },
    {
      to: '/cancellation',
      label: 'Cancel',
      icon: <Ban className="w-5 h-5" />,
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1130]/95 backdrop-blur-md border-t border-[#26336B] px-2 py-1.5 flex items-center justify-around select-none">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center p-1.5 rounded-xl transition-all relative ${
              isActive
                ? 'text-[#3B82F6] font-semibold'
                : 'text-[#9AA6D6] hover:text-[#F4F6FF]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                {item.icon}
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#EC4899] ring-2 ring-[#0B1130]" />
                )}
              </div>
              <span className="text-[11px] mt-0.5">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#3B82F6] mt-0.5" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};
