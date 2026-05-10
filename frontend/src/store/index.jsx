import { createContext, useReducer, useContext } from 'react';

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

const initialState = {
    email: localStorage.getItem('email') || null,
    token: getValidToken(),
    user: getSavedUser()
};

function authReducer(state, action) {
    switch (action.type) {
        case 'SET_USER': {
            const { token, email, user } = action.payload;
            localStorage.setItem('token', token);
            localStorage.setItem('email', email);
            if (user) localStorage.setItem('user', JSON.stringify(user));
            return { email, token, user: user || null };
        }
        case 'CLEAR_USER': {
            localStorage.removeItem('token');
            localStorage.removeItem('email');
            localStorage.removeItem('user');
            return { email: null, token: null, user: null };
        }
        case 'UPDATE_USER': {
            const updated = { ...state.user, ...action.payload };
            localStorage.setItem('user', JSON.stringify(updated));
            return { ...state, user: updated };
        }
        default:
            return state;
    }
}

const AuthContext = createContext(null);
const AuthDispatchContext = createContext(null);

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);
    return (
        <AuthContext.Provider value={state}>
            <AuthDispatchContext.Provider value={dispatch}>
                {children}
            </AuthDispatchContext.Provider>
        </AuthContext.Provider>
    );
}

export function useAuthState() {
    return useContext(AuthContext);
}

export function useAuthDispatch() {
    return useContext(AuthDispatchContext);
}

export const setUser   = payload => ({ type: 'SET_USER', payload });
export const clearUser = ()      => ({ type: 'CLEAR_USER' });
export const updateUser = payload => ({ type: 'UPDATE_USER', payload });
