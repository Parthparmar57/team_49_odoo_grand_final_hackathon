import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newToast: ToastMessage = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const toast = {
    success: (msg: string) => showToast(msg, 'success'),
    error: (msg: string) => showToast(msg, 'error'),
    info: (msg: string) => showToast(msg, 'info'),
    warning: (msg: string) => showToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      {/* Light-Themed Responsive Toast Container */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] flex flex-col gap-3.5 max-w-sm sm:max-w-md w-[calc(100%-2rem)] pointer-events-none">
        {toasts.map((t) => {
          let containerStyle = 'bg-white border-slate-200 text-slate-900 shadow-xl';
          let barStyle = 'bg-slate-500';
          let Icon = Info;
          let iconColor = 'text-slate-600 bg-slate-100';

          if (t.type === 'success') {
            containerStyle = 'bg-emerald-50/95 border-emerald-200/90 text-emerald-950 shadow-xl shadow-emerald-600/10';
            barStyle = 'bg-emerald-500';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-600 bg-emerald-100/80';
          } else if (t.type === 'error') {
            containerStyle = 'bg-rose-50/95 border-rose-200/90 text-rose-950 shadow-xl shadow-rose-600/10';
            barStyle = 'bg-rose-500';
            Icon = AlertCircle;
            iconColor = 'text-rose-600 bg-rose-100/80';
          } else if (t.type === 'warning') {
            containerStyle = 'bg-amber-50/95 border-amber-200/90 text-amber-950 shadow-xl shadow-amber-600/10';
            barStyle = 'bg-amber-500';
            Icon = AlertTriangle;
            iconColor = 'text-amber-600 bg-amber-100/80';
          } else if (t.type === 'info') {
            containerStyle = 'bg-sky-50/95 border-sky-200/90 text-sky-950 shadow-xl shadow-sky-600/10';
            barStyle = 'bg-sky-500';
            Icon = Info;
            iconColor = 'text-sky-600 bg-sky-100/80';
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto relative overflow-hidden flex items-center justify-between gap-3 p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${containerStyle}`}
            >
              {/* Left Color Indicator Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${barStyle}`} />

              <div className="flex items-center gap-3 pl-1">
                <div className={`p-1.5 rounded-xl ${iconColor} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold leading-relaxed">{t.message}</div>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg shrink-0 hover:bg-black/5"
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

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
