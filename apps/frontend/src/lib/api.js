import axios from 'axios';
export const TOKEN_STORAGE_KEY = 'agiota-system.token';
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '/api',
    withCredentials: true
});
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (handler) => {
    unauthorizedHandler = handler;
};
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});
api.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
        unauthorizedHandler();
    }
    return Promise.reject(error);
});
export { api };
