import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantClasses = {
    // Primary: solid blue-600, white text, blue-500 glow on hover
    primary:
      'bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] active:scale-[0.98]',
    // Secondary: navy-700 bg, navy-600 border, blue-400 text
    secondary:
      'bg-[#18234F] border border-[#26336B] text-[#60A5FA] hover:bg-[#202E66] hover:border-[#3B82F6]/50 active:scale-[0.98]',
    // Ghost: transparent with blue-400 text
    ghost:
      'bg-transparent text-[#60A5FA] hover:bg-[#18234F] hover:text-[#93C5FD] active:scale-[0.98]',
    // Destructive: pink outline button that fills pink-500 on hover (Never red!)
    destructive:
      'bg-transparent border border-[#EC4899] text-[#EC4899] hover:bg-[#EC4899] hover:text-white active:scale-[0.98]',
    // Brand Gradient: purple to blue
    brand:
      'bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white hover:opacity-95 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] active:scale-[0.98]',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
