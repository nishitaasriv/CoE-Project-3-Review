import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  PlusCircle,
  Ban,
  TrendingUp,
  Settings as SettingsIcon,
  User as UserIcon,
  LogOut,
  Command,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { getSubscriptionReminder } from '../../lib/reminders';
import { PWAInstallButton } from '../ui/PWAInstallButton';

interface SidebarProps {
  onOpenCommandPalette: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenCommandPalette }) => {
  const { user, logout, isGuest } = useAuth();
  const { subscriptions } = useSubscriptions();

  // Calculate count of urgent renewals (due today, trial ending, <= 3 days)
  const urgentCount = subscriptions.filter((s) => {
    if (s.status !== 'active' && s.status !== 'trial') return false;
    const r = getSubscriptionReminder(s);
    return r.isUrgent;
  }).length;

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: urgentCount > 0 ? (
        <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-[#EC4899] text-white">
          {urgentCount}
        </span>
      ) : null,
    },
    {
      to: '/subscriptions',
      label: 'My Subscriptions',
      icon: <CreditCard className="w-5 h-5" />,
      badge: (
        <span className="text-xs text-[#9AA6D6] font-mono px-1.5 py-0.5 rounded bg-[#18234F]">
          {subscriptions.length}
        </span>
      ),
    },
    {
      to: '/add',
      label: 'Add Subscription',
      icon: <PlusCircle className="w-5 h-5" />,
    },
    {
      to: '/cancellation',
      label: 'Cancellation Assistant',
      icon: <Ban className="w-5 h-5" />,
    },
    {
      to: '/insights',
      label: 'Insights & Overlaps',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: <SettingsIcon className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#0B1130] border-r border-[#26336B] z-30 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#26336B]/60">
        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
          <span className="font-bold text-white text-lg tracking-wider font-display">S</span>
          {/* Tiny pink accent dot */}
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#EC4899] ring-2 ring-[#0B1130]" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-[#F4F6FF] font-display">
            SubTrack
          </span>
          <span className="block text-[10px] font-medium text-[#9AA6D6] tracking-wide uppercase">
            Subscription Assistant
          </span>
        </div>
      </div>

      {/* Quick Command Trigger */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#111A40] border border-[#26336B] hover:border-[#3B82F6]/50 text-xs text-[#9AA6D6] transition-colors cursor-pointer group"
        >
          <span className="flex items-center gap-2 group-hover:text-[#F4F6FF]">
            <Command className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Search or jump...</span>
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#18234F] border border-[#26336B] text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#18234F] text-[#F4F6FF] font-semibold shadow-sm'
                  : 'text-[#9AA6D6] hover:text-[#F4F6FF] hover:bg-[#111A40]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active blue-500 left bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#3B82F6] rounded-r-full shadow-[0_0_8px_#3B82F6]" />
                )}
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-[#3B82F6]' : 'text-[#9AA6D6]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Guest Mode Notice if applicable */}
      {isGuest && (
        <div className="mx-3 my-2 p-3 rounded-xl bg-[#18234F] border border-[#3B82F6]/30 text-xs text-[#9AA6D6]">
          <div className="flex items-center gap-1.5 text-[#60A5FA] font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Guest Mode</span>
          </div>
          <p className="leading-tight mb-2">Data stays only in this browser.</p>
          <NavLink
            to="/register"
            className="text-xs font-semibold text-[#3B82F6] hover:underline"
          >
            Create account & keep data →
          </NavLink>
        </div>
      )}

      {/* Footer Profile & PWA */}
      <div className="p-3 border-t border-[#26336B]/60 space-y-2">
        <div className="px-1">
          <PWAInstallButton />
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-[#111A40] border border-[#26336B]">
          <NavLink
            to="/profile"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.name ? user.name.slice(0, 2) : 'GT'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#F4F6FF] truncate">
                {user?.name || 'Guest User'}
              </p>
              <p className="text-[10px] text-[#9AA6D6] truncate">
                {user?.email || 'Local Browser'}
              </p>
            </div>
          </NavLink>

          <button
            onClick={logout}
            className="text-[#9AA6D6] hover:text-[#EC4899] p-1.5 rounded-lg hover:bg-[#18234F] transition-colors cursor-pointer"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
