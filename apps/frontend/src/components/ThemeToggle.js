import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from '../contexts/AuthContext';
const SunIcon = () => (_jsxs("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: [_jsx("circle", { cx: "12", cy: "12", r: "4" }), _jsx("path", { d: "M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0-1.414 1.414M7.05 16.95l-1.414 1.414" })] }));
const MoonIcon = () => (_jsx("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: _jsx("path", { d: "M21 12.79A9 9 0 0 1 11.21 3 7 7 0 0 0 12 17a7 7 0 0 0 9-4.21z" }) }));
const ThemeToggle = () => {
    const { theme, toggleTheme } = useAuth();
    return (_jsx("button", { type: "button", onClick: toggleTheme, className: "flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", "aria-label": "Alternar tema", children: theme === 'light' ? _jsx(MoonIcon, {}) : _jsx(SunIcon, {}) }));
};
export default ThemeToggle;
