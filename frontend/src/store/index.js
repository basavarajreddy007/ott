import { configureStore, createSlice } from '@reduxjs/toolkit';

function getSavedUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
}

function getValidToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            localStorage.removeItem('email');
            localStorage.removeItem('user');
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
        setUser: (state, action) => {
            state.email = action.payload.email;
            state.token = action.payload.token;
            state.user = action.payload.user || null;
        },
        clearUser: (state) => {
            state.email = null;
            state.token = null;
            state.user = null;
        },
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload };
            if (action.payload.plan) state.plan = action.payload.plan;
        }
    }
});

const uiSlice = createSlice({
    name: 'ui',
    initialState: { theme: 'dark' },
    reducers: {
        toggleTheme: (state) => {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
        }
    }
});

export const { setUser, clearUser, updateUser } = authSlice.actions;
export const { toggleTheme } = uiSlice.actions;

export default configureStore({
    reducer: {
        auth: authSlice.reducer,
        ui: uiSlice.reducer
    }
});
