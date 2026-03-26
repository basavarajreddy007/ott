import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/login.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const OTP_LENGTH = 6;

const api = axios.create({ baseURL: API, withCredentials: true });

const getError = (err, fallback) =>
  err.response?.data?.error || err.message || fallback;

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState(Array(OTP_LENGTH).fill(''));
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [timer, setTimer]     = useState(30);

  const inputRefs    = useRef([]);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (step === 2) {
      const t = setTimeout(() => inputRefs.current[0]?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [step]);

  useEffect(() => {
    if (step === 2 && otp.every(d => d !== '') && !loading && !success) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, otp, loading, success]);

  useEffect(() => {
    if (step !== 2 || timer <= 0) return;
    const t = setTimeout(() => setTimer(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [step, timer]);

  const handleEmailChange = e => {
    setError('');
    setEmail(e.target.value.trim().toLowerCase());
  };

  const handleOtpChange = (i, val) => {
    setError('');
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    if (val.length > 1) {
      val.slice(0, OTP_LENGTH).split('').forEach((c, idx) => { next[idx] = c; });
      setOtp(next);
      inputRefs.current[OTP_LENGTH - 1]?.blur();
      return;
    }
    next[i] = val;
    setOtp(next);
    if (val && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (otp[i]) {
        const next = [...otp];
        next[i] = '';
        setOtp(next);
      } else if (i > 0) {
        inputRefs.current[i - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = e => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setOtp(next);
    if (pasted.length === OTP_LENGTH) inputRefs.current[OTP_LENGTH - 1]?.blur();
    else inputRefs.current[pasted.length]?.focus();
  };

  const handleSendOtp = async e => {
    e?.preventDefault();
    if (loading || success) return;
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Enter a valid email'); return; }
    setLoading(true);
    try {
      const res = await api.post('/api/v1/auth/send-otp', { email });
      if (!res.data.success) throw new Error(res.data.error);
      setStep(2);
      setTimer(30);
    } catch (err) {
      setError(getError(err, 'Failed to send code'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async e => {
    e?.preventDefault();
    if (loading || success) return;
    setError('');
    setLoading(true);
    const currentId = ++requestIdRef.current;
    try {
      const res = await api.post('/api/v1/auth/verify-otp', { email, otp: otp.join('') });
      if (requestIdRef.current !== currentId) return;
      if (!res.data.success) throw new Error(res.data.error);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('email', email);
      window.dispatchEvent(new Event('storage'));
      setSuccess(true);
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      if (requestIdRef.current !== currentId) return;
      setError(getError(err, 'Invalid code'));
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      if (requestIdRef.current === currentId) setLoading(false);
    }
  };

  const otpFilled = otp.every(d => d !== '');

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
          <div className={`login-steps${step === 2 ? ' step-2' : ''}`}>

            <div className="login-step">
              <h2 className="login-form-title">Sign in</h2>
              <p className="login-form-sub">Enter your email and we'll send you a login code.</p>
              {error && step === 1 && <div className="login-error">{error}</div>}
              <form onSubmit={handleSendOtp}>
                <div className="login-field">
                  <label htmlFor="email" className="login-field-label">Email address</label>
                  <input
                    id="email"
                    type="email"
                    className="login-input"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    disabled={loading || success}
                  />
                </div>
                <button className="login-btn" type="submit" disabled={loading || success}>
                  <span className={`login-btn__text${loading ? ' hidden' : ''}`}>
                    Send Login Code
                  </span>
                  {loading && <span className="login-spinner" />}
                </button>
              </form>
            </div>

            <div className="login-step">
              <h2 className="login-form-title">Check your inbox</h2>
              <p className="login-form-sub">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
              {error && step === 2 && <div className="login-error">{error}</div>}
              {success && <div className="login-success">Signed in! Redirecting...</div>}
              <form onSubmit={handleVerifyOtp}>
                <div className="login-otp-row" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => (inputRefs.current[i] = el)}
                      className={`login-otp-box${digit ? ' filled' : ''}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      aria-label={`Digit ${i + 1}`}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      disabled={loading || success}
                    />
                  ))}
                </div>
                <button
                  className="login-btn"
                  type="submit"
                  disabled={loading || !otpFilled || success}
                >
                  <span className={`login-btn__text${loading ? ' hidden' : ''}`}>
                    {success ? '✓ Signed In' : 'Sign In'}
                  </span>
                  {loading && <span className="login-spinner" />}
                </button>
              </form>
              <button
                className="login-back"
                onClick={handleSendOtp}
                disabled={loading || timer > 0 || success}
              >
                {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
              </button>
              <button
                className="login-back"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setOtp(Array(OTP_LENGTH).fill(''));
                  setTimer(30);
                }}
                disabled={loading || success}
              >
                ← Use a different email
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
