import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PasswordInput, PasswordStrength } from '../components/auth/PasswordInput';
import { Button } from '../components/ui/Button';
import { AlertCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isGuest } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time confirm password mismatch error on touch
  const confirmMismatch = confirmTouched && confirmPassword !== password;

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Full name is required.';
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errs.email = 'Please provide a valid email address.';
    }

    if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      errs.password = 'Password must include at least one letter and one number.';
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (!agreePrivacy) {
      errs.agree = 'You must accept the privacy note to continue.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setConfirmTouched(true);

    if (!validate()) return;

    setIsLoading(true);
    try {
      // Pass normalized email and raw unaltered password (spaces & symbols preserved)
      await register(name.trim(), email.trim().toLowerCase(), password, isGuest);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrors({ form: err?.message || 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B1F] flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl bg-[#111A40] border border-[#26336B] shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] flex items-center justify-center text-white font-bold">
            S
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
          </div>
          <span className="text-xl font-bold font-display text-[#F4F6FF]">SubTrack</span>
        </div>

        <h2 className="text-xl font-bold text-[#F4F6FF] font-display">Create Account</h2>
        <p className="text-xs text-[#9AA6D6] mt-1 mb-6">
          {isGuest
            ? 'Save your guest subscriptions and access your private dashboard.'
            : 'Start taking control of all your renewals and free trials.'}
        </p>

        {errors.form && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 p-3 rounded-xl bg-[#18234F] border border-[#EC4899]/50 text-xs text-[#F472B6] flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-[#EC4899]" />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">Full Name</label>
            <input
              type="text"
              autoComplete="name"
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border text-sm text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none transition-colors ${
                errors.name
                  ? 'border-[#EC4899] text-[#F472B6]'
                  : 'border-[#26336B] focus:border-[#3B82F6]'
              }`}
            />
            {errors.name && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-center gap-1.5 text-xs text-[#F472B6] mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#EC4899]" />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">Email Address</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border text-sm text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none transition-colors ${
                errors.email
                  ? 'border-[#EC4899] text-[#F472B6]'
                  : 'border-[#26336B] focus:border-[#3B82F6]'
              }`}
            />
            {errors.email && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-center gap-1.5 text-xs text-[#F472B6] mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#EC4899]" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">Password</label>
            <PasswordInput
              autoComplete="new-password"
              placeholder="Min 8 chars with letter & number"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              error={errors.password}
            />
            <PasswordStrength password={password} />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
              Confirm Password
            </label>
            <PasswordInput
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmTouched(true);
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }}
              onBlur={() => setConfirmTouched(true)}
              error={
                confirmMismatch
                  ? 'Passwords do not match.'
                  : errors.confirmPassword
              }
            />
          </div>

          <div className="pt-1">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="agree"
                checked={agreePrivacy}
                onChange={(e) => {
                  setAgreePrivacy(e.target.checked);
                  if (errors.agree) setErrors((prev) => ({ ...prev, agree: '' }));
                }}
                className="mt-0.5 w-4 h-4 rounded border-[#26336B] bg-[#18234F] text-[#3B82F6] focus:ring-[#3B82F6] cursor-pointer"
              />
              <label htmlFor="agree" className="text-xs text-[#9AA6D6] leading-relaxed cursor-pointer">
                I understand that SubTrack stores my data in this browser using hashed PBKDF2 credentials with zero external server tracking.
              </label>
            </div>
            {errors.agree && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-center gap-1.5 text-xs text-[#F472B6] mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#EC4899]" />
                <span>{errors.agree}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Create Account
          </Button>
        </form>

        <p className="text-xs text-center text-[#9AA6D6] mt-6 pt-6 border-t border-[#26336B]/60">
          Already have an account?{' '}
          <NavLink to="/login" className="font-semibold text-[#60A5FA] hover:underline">
            Sign in
          </NavLink>
        </p>
      </div>
    </div>
  );
};
