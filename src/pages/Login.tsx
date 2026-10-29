import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PasswordInput } from '../components/auth/PasswordInput';
import { Button } from '../components/ui/Button';
import { authService } from '../lib/auth/authService';
import { isWebCryptoAvailable } from '../lib/auth/passwordHash';
import {
  Clock,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginGuest, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [webCryptoSupported, setWebCryptoSupported] = useState(true);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Check Web Crypto API availability
  useEffect(() => {
    setWebCryptoSupported(isWebCryptoAvailable());
  }, []);

  // Check failed login cooldown timer
  useEffect(() => {
    const checkCooldown = () => {
      const remaining = authService.getCooldownSeconds();
      setCooldown(remaining);
    };
    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || cooldown > 0) return;
    setErrorMsg(null);

    // Only email is trimmed; password must never be trimmed or lowercased
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      // Pass normalized email and raw unaltered password
      await login(email.trim().toLowerCase(), password, rememberMe);
      navigate(from, { replace: true });
    } catch (err: any) {
      // Show generic error unless it is a cooldown lockout message
      const msg = err?.message || '';
      if (msg.includes('Too many failed attempts')) {
        setErrorMsg(msg);
      } else {
        setErrorMsg('Incorrect email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    loginGuest();
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#070B1F] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden select-none">
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3B82F6]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Hero Section (Desktop) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center pr-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.5)]">
              <span className="font-bold text-white text-2xl font-display">S</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#EC4899] ring-2 ring-[#070B1F]" />
            </div>
            <div>
              <span className="text-3xl font-extrabold text-[#F4F6FF] font-display tracking-tight">
                SubTrack
              </span>
              <span className="block text-xs uppercase tracking-widest text-[#9AA6D6] font-medium">
                Subscription & Renewal Assistant
              </span>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold text-[#F4F6FF] font-display tracking-tight leading-tight mb-4">
            Never miss a renewal.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#3B82F6]">
              Never pay for a forgotten trial.
            </span>
          </h1>

          <p className="text-sm text-[#9AA6D6] leading-relaxed mb-8 max-w-lg">
            SubTrack puts you back in command of your recurring expenses with multi-currency
            tracking, automated trial alerts, step-by-step cancellation guidance, and 100% private
            local browser storage.
          </p>

          {/* Animated Hero Preview Card */}
          <div className="space-y-3 max-w-md">
            <div className="p-3.5 rounded-2xl bg-[#111A40]/80 border border-[#26336B] shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#18234F] border border-[#26336B] flex items-center justify-center font-bold text-sm text-[#60A5FA]">
                  N
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F4F6FF]">Netflix Premium</p>
                  <p className="text-xs text-[#9AA6D6]">Renews in 3 days</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[#F4F6FF]">₹649 / mo</span>
                <span className="block text-[10px] text-[#A78BFA] font-medium">Auto-Roll Active</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#111A40]/80 border border-[#EC4899]/40 shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#18234F] border border-[#26336B] flex items-center justify-center font-bold text-sm text-[#F472B6]">
                  C
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F4F6FF]">Canva Pro Trial</p>
                  <p className="text-xs text-[#F472B6] font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Trial ends tomorrow!</span>
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/40">
                Cancel Ready
              </span>
            </div>
          </div>
        </div>

        {/* Right Glass Card (Form) */}
        <div className="lg:col-span-5 w-full">
          <div className="w-full rounded-3xl bg-[#111A40] border border-[#26336B] shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative">
            {/* Mobile Logo on top */}
            <div className="flex items-center gap-2.5 mb-6 lg:hidden">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] flex items-center justify-center text-white font-bold">
                S
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
              </div>
              <span className="text-xl font-bold font-display text-[#F4F6FF]">SubTrack</span>
            </div>

            <h2 className="text-xl font-bold text-[#F4F6FF] font-display">Sign in to SubTrack</h2>
            <p className="text-xs text-[#9AA6D6] mt-1 mb-6">
              Track renewals, optimize spending, and cancel trials with confidence.
            </p>

            {!webCryptoSupported && (
              <div className="mb-4 p-3 rounded-xl bg-[#18234F] border border-[#EC4899] text-xs text-[#F472B6] flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-[#EC4899] mt-0.5" />
                <span>
                  Web Crypto PBKDF2 API is unavailable in this environment. Secure local hashing requires HTTPS or localhost.
                </span>
              </div>
            )}

            {cooldown > 0 && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-4 p-3 rounded-xl bg-[#18234F] border border-[#EC4899]/50 text-xs text-[#F472B6] flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-[#EC4899]" />
                <span>
                  Too many failed attempts. Locked for{' '}
                  <strong className="font-mono">{cooldown}s</strong>.
                </span>
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-4 p-3 rounded-xl bg-[#18234F] border border-[#EC4899]/50 text-xs text-[#F472B6] flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-[#EC4899]" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={cooldown > 0 || isLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border border-[#26336B] text-sm text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30 transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#9AA6D6]">Password</label>
                  <NavLink
                    to="/forgot-password"
                    className="text-xs text-[#60A5FA] hover:underline"
                  >
                    Forgot password?
                  </NavLink>
                </div>
                <PasswordInput
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={cooldown > 0 || isLoading}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={cooldown > 0 || isLoading}
                  className="w-4 h-4 rounded border-[#26336B] bg-[#18234F] text-[#3B82F6] focus:ring-[#3B82F6] cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs text-[#9AA6D6] cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
                disabled={cooldown > 0 || isLoading}
              >
                Sign in
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#26336B]/60 text-center space-y-4">
              <p className="text-xs text-[#9AA6D6]">
                Don't have an account?{' '}
                <NavLink to="/register" className="font-semibold text-[#60A5FA] hover:underline">
                  Create an account
                </NavLink>
              </p>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#26336B]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-[#111A40] text-[#9AA6D6]">Or explore instantly</span>
                </div>
              </div>

              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={handleGuestLogin}
                >
                  Continue as Guest
                </Button>
                <p className="text-[11px] text-[#9AA6D6] mt-2">
                  Guest data stays only in this browser with sample demo subscriptions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
