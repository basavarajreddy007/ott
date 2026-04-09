import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/index.js';
import api from '../services/api';
import '../css/login.css';

export default function Register() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        const { email, password, confirmPassword } = formData;

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);

        try {
            // Register user
            await api.post('/api/v1/auth/register', { email: email.toLowerCase(), password });

            // Auto-login after successful registration
            const res = await api.post('/api/v1/auth/login', { email: email.toLowerCase(), password });
            const { token, user } = res.data;

            // Save auth info
            localStorage.setItem('token', token);
            localStorage.setItem('email', email);
            if (user) localStorage.setItem('user', JSON.stringify(user));

            // Update app state and go home
            dispatch(setUser({ email, token, user: user || null }));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-left">
                <div className="login-left__grid" />
                <div className="login-left__bg" />
                <div className="login-left__content">
                    <div className="login-left__logo">streamer</div>
                    <h1 className="login-left__headline">
                        Join us<br />
                        <span>Start streaming today</span>
                    </h1>
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
                            <input
                                id="email"
                                type="email"
                                className="login-input"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="login-field">
                            <label htmlFor="password" className="login-field-label">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="login-input"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                disabled={loading}
                            />
                        </div>

                        <div className="login-field">
                            <label htmlFor="confirmPassword" className="login-field-label">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="login-input"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                disabled={loading}
                            />
                        </div>

                        <button className="login-btn" type="submit" disabled={loading}>
                            {loading ? <span className="login-spinner" /> : 'Create Account'}
                        </button>

                        <p className="login-register-prompt">
                            Already have an account? <Link to="/login">Sign in here</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
