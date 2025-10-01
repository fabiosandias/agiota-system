import { jsx as _jsx } from "react/jsx-runtime";
const Avatar = ({ name, className = '' }) => {
    const initials = (name ?? '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || '?';
    return (_jsx("span", { className: `flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold uppercase text-white shadow ${className}`, children: initials }));
};
export default Avatar;
