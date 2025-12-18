'use client';

/**
 * COMPONENTE: SISTEMA DE TOASTS
 * Notificaciones toast para feedback visual
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove después de 5 segundos
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message });
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message });
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const styles = {
    success: {
      bg: 'bg-green-50 border-green-500',
      icon: '✅',
      textColor: 'text-green-800',
    },
    error: {
      bg: 'bg-red-50 border-red-500',
      icon: '❌',
      textColor: 'text-red-800',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-500',
      icon: '⚠️',
      textColor: 'text-yellow-800',
    },
    info: {
      bg: 'bg-blue-50 border-blue-500',
      icon: 'ℹ️',
      textColor: 'text-blue-800',
    },
  };

  const style = styles[toast.type];

  return (
    <div
      className={`${style.bg} border-l-4 rounded-lg shadow-lg p-4 pointer-events-auto animate-slide-in`}
      role="alert"
    >
      <div className="flex items-start">
        <span className="text-2xl mr-3">{style.icon}</span>
        <div className="flex-1">
          <p className={`font-semibold ${style.textColor}`}>{toast.title}</p>
          {toast.message && (
            <p className={`text-sm mt-1 ${style.textColor} opacity-90`}>{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className={`ml-3 ${style.textColor} hover:opacity-70`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
