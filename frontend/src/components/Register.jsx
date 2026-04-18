import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/index.js';
import api from '../services/api';
import '../css/login.css';

function saveSession(dispatch, email, token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    if (user) localStorage.setItem('user', JSON.stringify(user));
    dispatch(setUser({ email, token, user: user || null }));
}

export default function Register() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [form, setForm]       = useState({ email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    const handleChange = e => setForm(f => ({ ...f, [e.target.id]: e.target.value.trim() }));

    const handleRegister = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) return setError('Passwords do not match');
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/register', { email: form.email.toLowerCase(), password: form.password });
            const { data } = await api.post('/auth/login', { email: form.email.toLowerCase(), password: form.password });
            saveSession(dispatch, form.email, data.token, data.user);
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

                        {[
                            { id: 'email', type: 'email', label: 'Email address', placeholder: 'you@example.com' },
                            { id: 'password', type: 'password', label: 'Password', placeholder: '••••••••', minLength: 6 },
                            { id: 'confirmPassword', type: 'password', label: 'Confirm Password', placeholder: '••••••••', minLength: 6 }
                        ].map(({ id, label, ...props }) => (
                            <div key={id} className="login-field">
                                <label htmlFor={id} className="login-field-label">{label}</label>
                                <input id={id} className="login-input" value={form[id]} onChange={handleChange} required disabled={loading} {...props} />
                            </div>
                        ))}

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
