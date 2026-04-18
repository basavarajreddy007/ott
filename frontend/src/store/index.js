import { configureStore, createSlice } from '@reduxjs/toolkit';

function getSavedUser() {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
}

function getValidToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const { exp } = JSON.parse(atob(token.split('.')[1]));
        if (exp * 1000 < Date.now()) {
            ['token', 'email', 'user'].forEach(k => localStorage.removeItem(k));
            return null;
        }
        return token;
    } catch {
        localStorage.removeItem('token');
        return null;
    }
}

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        email: localStorage.getItem('email') || null,
        token: getValidToken(),
        user: getSavedUser()
    },
    reducers: {
        setUser: (state, { payload }) => {
            state.email = payload.email;
            state.token = payload.token;
            state.user  = payload.user || null;
        },
        clearUser: (state) => {
            state.email = state.token = state.user = null;
        },
        updateUser: (state, { payload }) => {
            if (payload) state.user = { ...state.user, ...payload };
        }
    }
});

const uiSlice = createSlice({
    name: 'ui',
    initialState: { theme: 'dark' },
    reducers: {
        toggleTheme: (state) => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; }
    }
});

export const { setUser, clearUser, updateUser } = authSlice.actions;
export const { toggleTheme } = uiSlice.actions;

export default configureStore({
    reducer: { auth: authSlice.reducer, ui: uiSlice.reducer }
});
