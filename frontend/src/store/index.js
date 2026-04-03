import { configureStore, createSlice } from '@reduxjs/toolkit';

function getSavedUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
}

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        email: localStorage.getItem('email') || null,
        token: localStorage.getItem('token') || null,
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
