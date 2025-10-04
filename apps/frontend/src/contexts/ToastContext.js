import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from 'react';
const ToastContext = createContext({});
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const showToast = useCallback((type, message, duration = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        const toast = { id, type, message, duration };
        setToasts((prev) => [...prev, toast]);
        if (duration > 0) {
            setTimeout(() => {
                hideToast(id);
            }, duration);
        }
    }, []);
    const hideToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);
    return (_jsx(ToastContext.Provider, { value: { toasts, showToast, hideToast }, children: children }));
};
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};
