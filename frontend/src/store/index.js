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
        const isExpired = payload.exp * 1000 < Date.now();
        if (isExpired) {
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
        setUser: function(state, action) {
            state.email = action.payload.email;
            state.token = action.payload.token;
            state.user  = action.payload.user || null;
            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('email', action.payload.email);
            if (action.payload.user) {
                localStorage.setItem('user', JSON.stringify(action.payload.user));
            }
        },
        clearUser: function(state) {
            state.email = null;
            state.token = null;
            state.user  = null;
            localStorage.removeItem('token');
            localStorage.removeItem('email');
            localStorage.removeItem('user');
        },
        updateUser: function(state, action) {
            if (action.payload) {
                state.user = Object.assign({}, state.user, action.payload);
                localStorage.setItem('user', JSON.stringify(state.user));
            }
        }
    }
});

const uiSlice = createSlice({
    name: 'ui',
    initialState: { theme: 'dark' },
    reducers: {
        toggleTheme: function(state) {
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
