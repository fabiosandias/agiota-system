import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
const AvatarUpload = ({ currentAvatar, onAvatarChange }) => {
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
    const [completedCrop, setCompletedCrop] = useState();
    const imgRef = useRef(null);
    const fileInputRef = useRef(null);
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    const handleCropComplete = async () => {
        if (!completedCrop || !imgRef.current)
            return;
        const canvas = document.createElement('canvas');
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
        const targetSize = 256;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        ctx.drawImage(imgRef.current, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, targetSize, targetSize);
        canvas.toBlob((blob) => {
            if (!blob)
                return;
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64String = reader.result;
                onAvatarChange(base64String);
                setImgSrc('');
            };
        }, 'image/jpeg', 0.9);
    };
    const handleRemoveAvatar = () => {
        onAvatarChange(null);
        setImgSrc('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "h-48 w-48 overflow-hidden rounded-full border-4 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800", children: currentAvatar ? (_jsx("img", { src: currentAvatar, alt: "Avatar", className: "h-full w-full object-cover" })) : (_jsx("div", { className: "flex h-full w-full items-center justify-center text-slate-400", children: _jsx("svg", { className: "h-24 w-24", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z", clipRule: "evenodd" }) }) })) }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), className: "rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700", children: "Escolher foto" }), currentAvatar && (_jsx("button", { type: "button", onClick: handleRemoveAvatar, className: "rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800", children: "Remover" }))] })] }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleFileSelect, className: "hidden" }), imgSrc && (_jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800", children: [_jsx("p", { className: "mb-4 text-sm font-medium text-slate-700 dark:text-slate-300", children: "Ajuste a \u00E1rea da foto que deseja usar:" }), _jsx("div", { className: "mx-auto", style: { maxWidth: '500px' }, children: _jsx(ReactCrop, { crop: crop, onChange: (c) => setCrop(c), onComplete: (c) => setCompletedCrop(c), aspect: 1, circularCrop: true, children: _jsx("img", { ref: imgRef, src: imgSrc, alt: "Crop preview", style: { maxWidth: '100%', maxHeight: '500px', display: 'block' }, className: "mx-auto" }) }) }), _jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [_jsx("button", { type: "button", onClick: () => setImgSrc(''), className: "rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700", children: "Cancelar" }), _jsx("button", { type: "button", onClick: handleCropComplete, className: "rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700", children: "Aplicar recorte" })] })] }))] }));
};
export default AvatarUpload;
