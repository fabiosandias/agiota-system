import { useEffect } from 'react';
import { useToast, type ToastType } from '../contexts/ToastContext';

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700 text-green-800 dark:text-green-100',
  error: 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700 text-red-800 dark:text-red-100',
  warning: 'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-100',
  info: 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-100'
};

const ICON_COLORS: Record<ToastType, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white'
};

export default function ToastContainer() {
  const { toasts, hideToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            ${TOAST_COLORS[toast.type]}
            border rounded-lg px-4 py-3 shadow-lg
            flex items-start gap-3
            animate-in slide-in-from-right duration-300
          `}
        >
          {/* Icon */}
          <div className={`${ICON_COLORS[toast.type]} w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-sm font-bold">{TOAST_ICONS[toast.type]}</span>
          </div>

          {/* Message */}
          <p className="flex-1 text-sm font-medium leading-relaxed">
            {toast.message}
          </p>

          {/* Close button */}
          <button
            onClick={() => hideToast(toast.id)}
            className="text-current opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
