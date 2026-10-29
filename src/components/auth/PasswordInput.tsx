import React, { useState, useRef } from 'react';
import { Eye, EyeOff, AlertCircle, ShieldAlert, Shield, ShieldCheck, Sparkles } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  className = '',
  id,
  autoComplete = 'current-password',
  ...props
}) => {
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShow((prev) => !prev);
    // Maintain focus on the password input so typing is not interrupted
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={`w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#18234F] border text-sm text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none transition-colors ${
            error
              ? 'border-[#EC4899] text-[#F472B6] focus:border-[#EC4899] focus:ring-2 focus:ring-[#EC4899]/30'
              : 'border-[#26336B] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30'
          } ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={handleToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA6D6] hover:text-[#F4F6FF] focus:outline-none p-1 rounded-md hover:bg-[#111A40] transition-colors cursor-pointer"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-1.5 text-xs text-[#F472B6] mt-1.5"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#EC4899]" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  if (!password) return null;

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  let level: 'weak' | 'fair' | 'good' | 'strong' = 'weak';

  if (!hasMinLength || !hasLetter || !hasNumber) {
    level = 'weak';
  } else if (hasMixedCase && hasSpecial && password.length >= 10) {
    level = 'strong';
  } else if (hasMixedCase || hasSpecial) {
    level = 'good';
  } else {
    level = 'fair';
  }

  const config = {
    weak: {
      label: 'Weak',
      hint: 'Min 8 chars with letter & number',
      width: 'w-1/4',
      barColor: 'bg-[#EC4899]',
      textColor: 'text-[#F472B6]',
      Icon: ShieldAlert,
    },
    fair: {
      label: 'Fair',
      hint: 'Add symbols or uppercase for better security',
      width: 'w-2/4',
      barColor: 'bg-[#8B5CF6]',
      textColor: 'text-[#A78BFA]',
      Icon: Shield,
    },
    good: {
      label: 'Good',
      hint: 'Solid combination of characters',
      width: 'w-3/4',
      barColor: 'bg-[#3B82F6]',
      textColor: 'text-[#60A5FA]',
      Icon: ShieldCheck,
    },
    strong: {
      label: 'Strong',
      hint: 'Excellent password entropy',
      width: 'w-full',
      barColor: 'bg-gradient-to-r from-[#7C3AED] to-[#3B82F6]',
      textColor: 'text-[#60A5FA]',
      Icon: Sparkles,
    },
  }[level];

  const { Icon } = config;

  return (
    <div className="mt-2 space-y-1.5" aria-label={`Password strength: ${config.label}`}>
      <div className="h-1.5 w-full bg-[#18234F] rounded-full overflow-hidden border border-[#26336B]/60">
        <div
          className={`h-full transition-all duration-300 rounded-full ${config.width} ${config.barColor}`}
        />
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-[#9AA6D6]">
          <Icon className={`w-3.5 h-3.5 ${config.textColor}`} />
          <span>Strength:</span>
          <span className={`font-semibold ${config.textColor}`}>{config.label}</span>
        </div>
        <span className="text-[10px] text-[#9AA6D6]/80">{config.hint}</span>
      </div>
    </div>
  );
};
