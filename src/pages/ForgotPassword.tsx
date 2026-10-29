import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PasswordInput, PasswordStrength } from '../components/auth/PasswordInput';
import { authService } from '../lib/auth/authService';
import { ArrowLeft, CheckCircle2, Shield, AlertCircle } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const normEmail = email.trim().toLowerCase();
    const normName = fullName.trim();

    if (!normEmail || !normName) {
      setErrorMsg('Please enter both your registered email and full name.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters.');
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setErrorMsg('New password must contain at least one letter and one number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(normEmail, normName, newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'No account matches the provided email and account name.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B1F] flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl bg-[#111A40] border border-[#26336B] shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10">
        <NavLink
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-[#60A5FA] hover:underline mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign in</span>
        </NavLink>

        <h2 className="text-xl font-bold text-[#F4F6FF] font-display">Reset Password</h2>
        
        {/* Local mode privacy notice */}
        <div className="my-4 p-3 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#9AA6D6] flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            SubTrack stores all accounts locally in your browser with zero external server tracking. To reset your password, verify your registered email and account name below.
          </p>
        </div>

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

        {isSuccess ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/20 border border-[#3B82F6]/50 text-[#3B82F6] flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#F4F6FF]">Password Reset Complete</h3>
            <p className="text-xs text-[#9AA6D6] leading-relaxed">
              Your password has been securely updated using PBKDF2 Web Crypto hashing. You can now sign in with your new credentials.
            </p>
            <NavLink to="/login">
              <Button variant="primary" size="md" className="w-full mt-2">
                Sign In with New Password
              </Button>
            </NavLink>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
                Registered Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border border-[#26336B] text-sm text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none focus:border-[#3B82F6] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
                Registered Full Name
              </label>
              <input
                type="text"
                autoComplete="name"
                placeholder="e.g. Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border border-[#26336B] text-sm text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none focus:border-[#3B82F6] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
                New Password
              </label>
              <PasswordInput
                autoComplete="new-password"
                placeholder="Min 8 chars with letter & number"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <PasswordStrength password={newPassword} />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
                Confirm New Password
              </label>
              <PasswordInput
                autoComplete="new-password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Reset Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
