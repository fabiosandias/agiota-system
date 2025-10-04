import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
const BalanceVisibilityContext = createContext({
    showBalance: true,
    toggleBalance: () => { }
});
export const BalanceVisibilityProvider = ({ children }) => {
    const [showBalance, setShowBalance] = useState(() => {
        const saved = localStorage.getItem('showBalance');
        return saved !== null ? saved === 'true' : true;
    });
    // Sincronização entre abas
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'showBalance' && e.newValue !== null) {
                setShowBalance(e.newValue === 'true');
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);
    // BroadcastChannel para sincronização entre abas da mesma origem
    useEffect(() => {
        const channel = new BroadcastChannel('balance-visibility');
        channel.onmessage = (event) => {
            if (event.data.type === 'toggle') {
                setShowBalance(event.data.value);
            }
        };
        return () => channel.close();
    }, []);
    const toggleBalance = () => {
        setShowBalance((prev) => {
            const newValue = !prev;
            localStorage.setItem('showBalance', String(newValue));
            // Broadcast para outras abas
            try {
                const channel = new BroadcastChannel('balance-visibility');
                channel.postMessage({ type: 'toggle', value: newValue });
                channel.close();
            }
            catch (e) {
                // BroadcastChannel não suportado, apenas localStorage será usado
            }
            return newValue;
        });
    };
    return (_jsx(BalanceVisibilityContext.Provider, { value: { showBalance, toggleBalance }, children: children }));
};
export const useBalanceVisibility = () => {
    const context = useContext(BalanceVisibilityContext);
    if (!context) {
        throw new Error('useBalanceVisibility must be used within BalanceVisibilityProvider');
    }
    return context;
};
