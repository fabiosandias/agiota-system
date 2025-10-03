import { jsx as _jsx } from "react/jsx-runtime";
const Avatar = ({ name, avatar, className = '' }) => {
    const initials = (name ?? '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || '?';
    // Se tem avatar, mostrar a foto
    if (avatar) {
        return (_jsx("img", { src: avatar, alt: name || 'Avatar', className: `h-10 w-10 rounded-full object-cover shadow ${className}` }));
    }
    // Senão, mostrar as iniciais
    return (_jsx("span", { className: `flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold uppercase text-white shadow ${className}`, children: initials }));
};
export default Avatar;
