import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    res => res,
    err => {
        const status = err.response?.status;
        const hash = window.location.hash;
        const isAuthPage = hash.includes('/login') || hash.includes('/register');
        const isUploadRoute = err.config?.url?.includes('/api/upload/');

        if (status === 401 && !isAuthPage && !isUploadRoute) {
            ['token', 'email', 'user'].forEach(k => localStorage.removeItem(k));
            window.location.href = '/#/login';
        }

        return Promise.reject(err);
    }
);

export default api;
