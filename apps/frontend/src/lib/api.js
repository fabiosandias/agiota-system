import axios from 'axios';
const TOKEN_KEY = 'aitron_token';
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '/api'
});
// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (handler) => {
    unauthorizedHandler = handler;
};
// Interceptor de resposta para tratar 401
api.interceptors.response.use((response) => response, async (error) => {
    const { response } = error;
    if (response?.status === 401 && unauthorizedHandler) {
        localStorage.removeItem(TOKEN_KEY);
        unauthorizedHandler();
    }
    return Promise.reject(error);
});
export const setToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
};
export const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
};
export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};
export { api };
