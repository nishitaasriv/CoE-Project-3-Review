import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B1F]/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} bg-[#111A40] border border-[#26336B] rounded-2xl shadow-2xl p-6 relative transition-all duration-200`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#9AA6D6] hover:text-[#F4F6FF] p-1 rounded-lg hover:bg-[#18234F] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4 pr-6">
          <h2 className="text-xl font-semibold text-[#F4F6FF] font-display">{title}</h2>
          {description && <p className="text-sm text-[#9AA6D6] mt-1">{description}</p>}
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};
