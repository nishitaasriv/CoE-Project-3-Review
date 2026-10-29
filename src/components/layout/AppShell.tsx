import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from '../ui/CommandPalette';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useNotifications } from '../../hooks/useNotifications';
import { downloadAllCalendarEvents } from '../../lib/ics';
import {
  Eye,
  EyeOff,
  Bell,
  Lock,
  WifiOff,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';

export const AppShell: React.FC = () => {
  const { user, isLocked, unlockApp, lockApp } = useAuth();
  const { settings, toggleHideAmounts } = useSettings();
  const { subscriptions } = useSubscriptions();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();

  const [cmdOpen, setCmdOpen] = useState(false);
  const [unlockKey, setUnlockKey] = useState('');
  const [unlockError, setUnlockError] = useState(false);

  // Initialize notifications
  useNotifications(subscriptions, settings.browserNotificationsEnabled);

  // Auto-lock inactivity listener
  useEffect(() => {
    if (!settings.autoLockMinutes || settings.autoLockMinutes <= 0) return;

    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lockApp();
      }, settings.autoLockMinutes * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [settings.autoLockMinutes, lockApp]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await unlockApp(unlockKey);
    if (!success) {
      setUnlockError(true);
    } else {
      setUnlockKey('');
      setUnlockError(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1130] text-[#F4F6FF] flex flex-col">
      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="bg-[#18234F] border-b border-[#26336B] px-4 py-2 text-center text-xs text-[#9AA6D6] flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-[#F472B6]" />
          <span>You are offline. SubTrack is operating fully from cached browser data.</span>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar onOpenCommandPalette={() => setCmdOpen(true)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 pb-20 lg:pb-8">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 h-16 bg-[#0B1130]/90 backdrop-blur-md border-b border-[#26336B] px-4 sm:px-8 flex items-center justify-between">
          {/* Mobile Brand */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] flex items-center justify-center font-bold text-white text-sm">
              S
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#EC4899]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#F4F6FF] font-display">
              SubTrack
            </span>
          </div>

          {/* Desktop search pill */}
          <div className="hidden lg:block">
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111A40] border border-[#26336B] text-xs text-[#9AA6D6] hover:border-[#3B82F6]/40 cursor-pointer"
            >
              <span>Quick Navigation (Ctrl+K)</span>
            </button>
          </div>

          {/* Right action controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Base Currency Badge */}
            <NavLink
              to="/settings"
              className="px-2.5 py-1 rounded-lg bg-[#18234F] border border-[#26336B] hover:border-[#3B82F6]/50 text-xs font-semibold text-[#60A5FA] flex items-center gap-1.5"
              title="Base currency for conversions"
            >
              <span>Base:</span>
              <span className="font-mono text-[#F4F6FF]">{settings.baseCurrency}</span>
            </NavLink>

            {/* Privacy Hide Amounts Blur Toggle */}
            <button
              onClick={toggleHideAmounts}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                settings.privacyModeHideAmounts
                  ? 'bg-[#2563EB]/20 border-[#3B82F6] text-[#60A5FA]'
                  : 'bg-[#18234F] border-[#26336B] text-[#9AA6D6] hover:text-[#F4F6FF]'
              }`}
              title={
                settings.privacyModeHideAmounts
                  ? 'Privacy mode active (amounts hidden)'
                  : 'Hide monetary amounts for privacy'
              }
              aria-label="Toggle privacy amounts"
            >
              {settings.privacyModeHideAmounts ? (
                <EyeOff className="w-4 h-4 text-[#3B82F6]" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>

            {/* Smart Import Button */}
            <button
              onClick={() => navigate('/add?tab=smart')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18234F] border border-[#7C3AED]/40 hover:border-[#8B5CF6] text-xs font-medium text-[#A78BFA] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Smart Import</span>
            </button>

            {/* Lock button if pin or auto-lock enabled */}
            {(settings.pinLockEnabled || settings.autoLockMinutes > 0) && (
              <button
                onClick={lockApp}
                className="p-2 rounded-xl bg-[#18234F] border border-[#26336B] text-[#9AA6D6] hover:text-[#F4F6FF] cursor-pointer"
                title="Lock session"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation Bar */}
      <MobileNav />

      {/* Global Command Palette */}
      <CommandPalette
        onOpenSmartImport={() => navigate('/add?tab=smart')}
        onDownloadCalendar={() => downloadAllCalendarEvents(subscriptions)}
      />

      {/* Inactivity / PIN Lock Modal */}
      {isLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B1F]/95 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl bg-[#111A40] border border-[#26336B] p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#18234F] border border-[#26336B] text-[#3B82F6] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#F4F6FF] font-display mb-1">
              SubTrack Locked
            </h2>
            <p className="text-xs text-[#9AA6D6] mb-5">
              Enter your account password or session PIN to continue.
            </p>

            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="password"
                placeholder="Enter password..."
                value={unlockKey}
                onChange={(e) => {
                  setUnlockKey(e.target.value);
                  setUnlockError(false);
                }}
                autoFocus
                className={`w-full px-4 py-2.5 rounded-xl bg-[#18234F] border text-sm text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none ${
                  unlockError
                    ? 'border-[#EC4899] text-[#F472B6]'
                    : 'border-[#26336B] focus:border-[#3B82F6]'
                }`}
              />

              {unlockError && (
                <p className="text-xs text-[#F472B6]">Incorrect credentials. Please try again.</p>
              )}

              <Button variant="primary" type="submit" className="w-full">
                Unlock SubTrack
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
