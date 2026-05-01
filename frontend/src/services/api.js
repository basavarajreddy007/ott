import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
});

api.interceptors.request.use(function(config) {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    function(res) {
        return res;
    },
    function(err) {
        const status = err.response && err.response.status;
        const path   = window.location.hash;
        const isAuthPage = path.includes('/login') || path.includes('/register');

        if (status === 401 && !isAuthPage) {
            localStorage.removeItem('token');
            localStorage.removeItem('email');
            localStorage.removeItem('user');
            window.location.href = '/#/login';
        }

        return Promise.reject(err);
    }
);

export default api;
