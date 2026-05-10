import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthDispatch, setUser } from '../store/index.jsx';
import api from '../services/api';
import '../css/login.css';

export default function Register() {
    const navigate = useNavigate();
    const dispatch = useAuthDispatch();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleRegister(e) {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/register', { email: email.toLowerCase(), password });
            dispatch(setUser({ email, token: res.data.token, user: res.data.user || null }));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-left">
                <div className="login-left__grid" />
                <div className="login-left__bg" />
                <div className="login-left__content">
                    <div className="login-left__logo">streamer</div>
                    <h1 className="login-left__headline">Join us<br /><span>Start streaming today</span></h1>
                    <p className="login-left__desc">Create an account to enjoy unlimited movies and series.</p>
                </div>
            </div>

            <div className="login-right">
                <div className="login-form-wrap">
                    <form className="login-step" onSubmit={handleRegister}>
                        <h2 className="login-form-title">Register</h2>
                        <p className="login-form-sub">Enter your details to create an account.</p>
                        {error && <div className="login-error">{error}</div>}

                        <div className="login-field">
                            <label htmlFor="email" className="login-field-label">Email address</label>
                            <input id="email" type="email" className="login-input" value={email}
                                onChange={e => setEmail(e.target.value.trim())}
                                placeholder="you@example.com" required disabled={loading} />
                        </div>

                        <div className="login-field">
                            <label htmlFor="password" className="login-field-label">Password</label>
                            <input id="password" type="password" className="login-input" value={password}
                                onChange={e => setPassword(e.target.value.trim())}
                                placeholder="••••••••" minLength={6} required disabled={loading} />
                        </div>

                        <div className="login-field">
                            <label htmlFor="confirmPassword" className="login-field-label">Confirm Password</label>
                            <input id="confirmPassword" type="password" className="login-input" value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value.trim())}
                                placeholder="••••••••" minLength={6} required disabled={loading} />
                        </div>

                        <button className="login-btn" type="submit" disabled={loading}>
                            {loading ? <span className="login-spinner" /> : 'Create Account'}
                        </button>
                        <p className="login-register-prompt">Already have an account? <Link to="/login">Sign in here</Link></p>
                    </form>
                </div>
            </div>
        </div>
    );
}
