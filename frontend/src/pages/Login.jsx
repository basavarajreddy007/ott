import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";
import { FaApple, FaGithub, FaGoogle, FaWindows } from "react-icons/fa";
import { HiEye, HiEyeOff, HiOutlineSun, HiOutlineMoon } from "react-icons/hi";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { authAPI } from "../services/api";
import "../css/Auth.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 24
    }
  }
};

export default function Login() {
  const { login, googleLogin, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("credentials");
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [emailFocus, setEmailFocus] = useState(false);

  const [passwordInput, setPasswordInput] = useState("");
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [devOtp, setDevOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputRefs = useRef([]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      triggerShake();
      return toast.error("Please fill in all fields");
    }
    setLoading(true);
    try {
      const res = await login({ email: emailInput, password: passwordInput });
      if (res?.data?.otp) {
        setDevOtp(res.data.otp);
      }
      setStep("otp");
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      toast.success("Verification code sent to your email");
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 80);
    } catch (err) {
      triggerShake();
      const msg = err.response?.data?.message || "Login failed";
      if (msg === "Please verify your email first") {
        navigate("/verify-otp", { state: { email: emailInput } });
        toast.error("Email not verified. Please complete verification.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const { data } = await authAPI.resendOtp({ email: emailInput });
      if (data?.otp) {
        setDevOtp(data.otp);
      }
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      toast.success("New verification code sent!");
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 80);
    } catch (err) {
      triggerShake();
      toast.error(err.response?.data?.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val, idx) => {
    const numericVal = val.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[idx] = numericVal;
    setOtp(newOtp);
    if (numericVal && idx < 5) {
      otpInputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (!otp[idx] && idx > 0) {
        const newOtp = [...otp];
        newOtp[idx - 1] = "";
        setOtp(newOtp);
        otpInputRefs.current[idx - 1]?.focus();
        e.preventDefault();
      } else if (otp[idx]) {
        const newOtp = [...otp];
        newOtp[idx] = "";
        setOtp(newOtp);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) {
      triggerShake();
      return toast.error("Please paste a 6-digit numeric verification code");
    }
    const digits = pastedData.split("");
    setOtp(digits);
    otpInputRefs.current[5]?.focus();
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      triggerShake();
      return toast.error("Please enter all 6 digits");
    }
    setLoading(true);
    try {
      await verifyLoginOtp({ email: emailInput, otp: otpCode, rememberMe });
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 1600);
    } catch (err) {
      triggerShake();
      toast.error(err.response?.data?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const fillDevOtp = () => {
    if (devOtp) {
      setOtp(devOtp.split(""));
      toast.success("Dev code autofilled");
    }
  };

  const handleMockOAuth = (provider) => {
    toast.loading(`${provider} authentication connection active...`, { duration: 1500 });
    setTimeout(() => {
      toast.success(`${provider} linked. Sign in via primary option or Google.`);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className={`auth-page ${isLightMode ? 'light' : ''}`} style={{ position: "relative", overflow: "hidden" }}>
        <div className="auth-gradient-bg">
          <div className="auth-glow-blob one" />
          <div className="auth-glow-blob two" />
        </div>
        <div className="auth-container" style={{ zIndex: 1, position: "relative" }}>
          <motion.div
            className="auth-card glass"
            style={{ textAlign: "center", padding: "40px" }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.svg
              width="90"
              height="90"
              viewBox="0 0 100 100"
              style={{ margin: "0 auto 24px", display: "block" }}
            >
              <motion.circle
                cx="50"
                cy="50"
                r="44"
                stroke="var(--color-success)"
                strokeWidth="6"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              <motion.path
                d="M32 52L45 65L70 36"
                stroke="var(--color-success)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
              />
            </motion.svg>
            <h2 className="auth-title">Welcome Back!</h2>
            <p className="auth-subtitle" style={{ margin: 0 }}>Login verified successfully. Redirecting you home...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`auth-page ${isLightMode ? 'light' : ''}`} style={{ position: "relative", overflow: "hidden" }}>
      <div className="auth-gradient-bg">
        <motion.div
          className="auth-glow-blob one"
          animate={{ x: [0, 40, -30, 0], y: [0, -30, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
        <motion.div
          className="auth-glow-blob two"
          animate={{ x: [0, -50, 30, 0], y: [0, 40, -30, 0] }}
          transition={{ duration: 24, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
        <motion.div
          className="auth-glow-blob three"
          animate={{ x: [0, 30, -30, 0], y: [0, -20, 30, 0] }}
          transition={{ duration: 22, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      </div>

      <div className="auth-container" style={{ zIndex: 1, position: "relative" }}>
        <motion.div
          className="auth-card glass"
          animate={{
            x: shake ? [-10, 10, -10, 10, -5, 5, 0] : 0,
            opacity: 1,
            y: 0
          }}
          transition={{ duration: 0.45 }}
          initial={{ opacity: 0, y: 35 }}
          style={{ transformOrigin: "center", position: "relative" }}
        >
          <motion.button
            type="button"
            onClick={() => setIsLightMode(!isLightMode)}
            className="theme-toggle-btn"
            whileHover={{ scale: 1.12, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle theme"
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "none",
              border: "none",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {isLightMode ? <HiOutlineMoon size={22} /> : <HiOutlineSun size={22} />}
          </motion.button>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" style={{ overflow: "visible" }}>
              <rect width="48" height="48" rx="12" fill="var(--color-accent-primary)" />
              <polygon points="32,24 18,14 18,34" fill="white" />
            </svg>
            <Link to="/" className="auth-logo" style={{ margin: 0 }}>MOVIEMAX</Link>
          </div>

          {step === "otp" ? (
            <>
              <h2 className="auth-title">Verify Login</h2>
              <p className="auth-subtitle">We have sent a verification code to <strong>{emailInput}</strong></p>

              <form onSubmit={handleOtpSubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: "6px" }}>Verification Code</label>
                  <div className="otp-inputs">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        className="otp-box"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        onPaste={handleOtpPaste}
                        required
                        aria-label={`OTP Digit ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="otp-resend-sec">
                  <span>Didn't get code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || loading}
                    className="otp-resend-btn"
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                  </button>
                </div>

                <div className="form-options" style={{ marginTop: 12 }}>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <span>Remember me</span>
                  </label>
                </div>

                <motion.button
                  type="submit"
                  className="auth-btn auth-btn-glow"
                  style={{ marginTop: 16 }}
                  disabled={loading}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? <span className="auth-spinner" /> : "Verify & Access"}
                </motion.button>

                {devOtp && (
                  <div className="dev-otp-badge" onClick={fillDevOtp} style={{ cursor: "pointer" }}>
                    <span className="dev-otp-title">🔧 Developer Mode Helper</span>
                    <span className="dev-otp-code">Click to Autofill Code: <strong>{devOtp}</strong></span>
                  </div>
                )}

                <p className="auth-switch" style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={() => setStep("credentials")}
                    style={{ background: "none", border: "none", color: "var(--color-accent-primary)", cursor: "pointer", font: "inherit", textDecoration: "underline", padding: 0 }}
                  >
                    Back to login
                  </button>
                </p>
              </form>
            </>
          ) : (
            <>
              <h2 className="auth-title">Sign In</h2>
              <p className="auth-subtitle">Welcome back! Access your cinematic streaming universe.</p>

              <motion.form
                onSubmit={handleCredentialSubmit}
                className="auth-form"
                variants={formVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="form-group" variants={itemVariants}>
                  <div className={`floating-group ${emailFocus || emailInput ? "focused" : ""} ${emailInput ? "has-value" : ""}`}>
                    <input
                      type="email"
                      className="floating-input"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onFocus={() => setEmailFocus(true)}
                      onBlur={() => setEmailFocus(false)}
                      required
                      placeholder="Email"
                      aria-label="Email Address"
                    />
                    <label className="floating-label">Email Address</label>
                  </div>
                </motion.div>

                <motion.div className="form-group" variants={itemVariants}>
                  <div className={`floating-group ${passwordFocus || passwordInput ? "focused" : ""} ${passwordInput ? "has-value" : ""}`}>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      className="floating-input"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      onFocus={() => setPasswordFocus(true)}
                      onBlur={() => setPasswordFocus(false)}
                      required
                      placeholder="Password"
                      style={{ paddingRight: "48px" }}
                      aria-label="Password"
                    />
                    <label className="floating-label">Password</label>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      tabIndex={-1}
                      aria-label={passwordVisible ? "Hide password" : "Show password"}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--color-text-tertiary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%"
                      }}
                    >
                      {passwordVisible ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                    </button>
                  </div>
                </motion.div>

                <motion.div className="form-options" variants={itemVariants}>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                </motion.div>

                <motion.button
                  type="submit"
                  className="auth-btn auth-btn-glow"
                  disabled={loading}
                  style={{ marginTop: 8 }}
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? <span className="auth-spinner" /> : "Sign In & Send Code"}
                </motion.button>
              </motion.form>

              <div className="auth-divider" style={{ justifyContent: "center", margin: "20px 0" }}>
                <span className="auth-divider-line" />
                <span className="auth-divider-text">or continue with</span>
                <span className="auth-divider-line" />
              </div>

              <div className="social-auth-grid">
                <div style={{ height: "44px", overflow: "hidden", display: "flex", width: "100%", borderRadius: "var(--radius-md)" }}>
                  {(!googleClientId || googleClientId === "your_google_client_id_here") ? (
                    <button className="social-btn" onClick={() => handleMockOAuth("Google")} style={{ width: "100%" }}>
                      <FaGoogle size={18} /> Google
                    </button>
                  ) : (
                    <GoogleLogin
                      onSuccess={async (credentialResponse) => {
                        setLoading(true);
                        try {
                           await googleLogin(credentialResponse.credential);
                           setIsSuccess(true);
                           setTimeout(() => {
                             navigate("/");
                           }, 1600);
                        } catch (err) {
                           triggerShake();
                           toast.error(err.response?.data?.message || "Google login failed");
                        } finally {
                           setLoading(false);
                        }
                      }}
                      onError={() => {
                        triggerShake();
                        toast.error("Google sign-in failed");
                      }}
                      size="large"
                      theme={isLightMode ? "outline" : "filled_black"}
                      text="signin_with"
                      shape="rectangular"
                      width="100%"
                    />
                  )}
                </div>

                <motion.button
                  type="button"
                  className="social-btn"
                  onClick={() => handleMockOAuth("GitHub")}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaGithub size={18} /> GitHub
                </motion.button>

                <motion.button
                  type="button"
                  className="social-btn"
                  onClick={() => handleMockOAuth("Apple")}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaApple size={18} /> Apple
                </motion.button>

                <motion.button
                  type="button"
                  className="social-btn"
                  onClick={() => handleMockOAuth("Microsoft")}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaWindows size={18} /> Microsoft
                </motion.button>
              </div>

              <p className="auth-switch" style={{ marginTop: 24 }}>
                Don't have an account? <Link to="/register">Sign Up</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
