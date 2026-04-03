import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/index.js';
import api from '../services/api';
import '../css/login.css';

export default function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        if (timer <= 0) return;
        const interval = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const sendOtp = async (e) => {
        e?.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/api/v1/auth/send-otp', { email });
            setStep(2);
            setOtp('');
            setTimer(30);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send code');
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/api/v1/auth/verify-otp', { email, otp });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('email', email);
            if (res.data.user) localStorage.setItem('user', JSON.stringify(res.data.user));
            dispatch(setUser({ email, token: res.data.token, user: res.data.user || null }));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid code');
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
                        Your next watch<br />is <span>one click away</span>
                    </h1>
                    <p className="login-left__desc">
                        Stream, discover, and save your favourite films and series.
                    </p>
                </div>
            </div>

            <div className="login-right">
                <div className="login-form-wrap">
                    {step === 1 ? (
                        <form className="login-step" onSubmit={sendOtp}>
                            <h2 className="login-form-title">Sign in</h2>
                            <p className="login-form-sub">Enter your email and we'll send you a login code.</p>
                            {error && <div className="login-error">{error}</div>}
                            <div className="login-field">
                                <label htmlFor="email" className="login-field-label">Email address</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="login-input"
                                    value={email}
                                    onChange={e => setEmail(e.target.value.trim().toLowerCase())}
                                    placeholder="you@example.com"
                                    required
                                    autoFocus
                                    disabled={loading}
                                />
                            </div>
                            <button className="login-btn" type="submit" disabled={loading}>
                                {loading ? <span className="login-spinner" /> : 'Send Login Code'}
                            </button>
                        </form>
                    ) : (
                        <form className="login-step" onSubmit={verifyOtp}>
                            <h2 className="login-form-title">Check your inbox</h2>
                            <p className="login-form-sub">We sent a 6-digit code to <strong>{email}</strong></p>
                            {error && <div className="login-error">{error}</div>}
                            <div className="login-field">
                                <label htmlFor="otp" className="login-field-label">Login code</label>
                                <input
                                    id="otp"
                                    type="text"
                                    inputMode="numeric"
                                    className="login-input"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    required
                                    autoFocus
                                    disabled={loading}
                                    maxLength={6}
                                />
                            </div>
                            <button className="login-btn" type="submit" disabled={loading || otp.length < 6}>
                                {loading ? <span className="login-spinner" /> : 'Sign In'}
                            </button>
                            <button type="button" className="login-back" onClick={sendOtp} disabled={timer > 0 || loading}>
                                {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                            </button>
                            <button type="button" className="login-back" onClick={() => { setStep(1); setError(''); }}>
                                ← Use a different email
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
