import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
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
        if (err.response?.status === 401) {
            const path = window.location.hash;
            if (!path.includes('/login') && !path.includes('/register')) {
                ['token', 'email', 'user'].forEach(k => localStorage.removeItem(k));
                window.location.href = '/#/login';
            }
        }
        return Promise.reject(err);
    }
);

export default api;
