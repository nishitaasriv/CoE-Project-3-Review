import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          let styles = 'bg-[#18234F] text-[#F4F6FF] border-[#26336B]';
          let icon = <Info className="w-5 h-5 text-[#8B5CF6]" />;

          if (toast.type === 'success') {
            // Blue with check icon
            styles = 'bg-[#111A40] border-[#3B82F6]/50 text-[#F4F6FF] shadow-[0_0_15px_rgba(59,130,246,0.2)]';
            icon = <CheckCircle2 className="w-5 h-5 text-[#3B82F6]" />;
          } else if (toast.type === 'error' || toast.type === 'warning') {
            // Pink with alert icon (Never red or amber!)
            styles = 'bg-[#18234F] border-[#EC4899]/60 text-[#F4F6FF] shadow-[0_0_15px_rgba(236,72,153,0.25)]';
            icon = <AlertTriangle className="w-5 h-5 text-[#EC4899]" />;
          } else if (toast.type === 'info') {
            // Purple with info icon
            styles = 'bg-[#18234F] border-[#8B5CF6]/50 text-[#F4F6FF] shadow-[0_0_15px_rgba(139,92,246,0.2)]';
            icon = <Info className="w-5 h-5 text-[#A78BFA]" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${styles} transition-all duration-200 animate-slide-up`}
              role="alert"
            >
              <div className="shrink-0 mt-0.5">{icon}</div>
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-[#9AA6D6] hover:text-[#F4F6FF] cursor-pointer"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
