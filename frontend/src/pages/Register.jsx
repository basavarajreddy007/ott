import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { authAPI } from "../services/api";
import PasswordInput from "../components/common/PasswordInput";
import "../css/Auth.css";

export default function Register() {
  const { googleLogin } = useAuth();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.register({ name: data.name, email: data.email, password: data.password });
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/verify-otp", { state: { email: data.email } });
        toast.success(res.data.message);
      }, 1500);
    } catch (err) {
      triggerShake();
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const onError = () => {
    triggerShake();
  };

  if (isSuccess) {
    return (
      <div className="auth-page" style={{ position: "relative", overflow: "hidden" }}>
        <motion.div
          className="auth-bg-zoom-overlay"
          initial={{ scale: 1 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 15, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle at center, rgba(13, 19, 37, 0.4) 0%, #020204 100%)",
            zIndex: 0
          }}
        />
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
            <h2 className="auth-title">Account Created!</h2>
            <p className="auth-subtitle" style={{ margin: 0 }}>Please check your email for the verification OTP.</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ position: "relative", overflow: "hidden" }}>
      <motion.div
        className="auth-bg-zoom-overlay"
        initial={{ scale: 1 }}
        animate={{ scale: 1.05 }}
        transition={{ duration: 25, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle at center, rgba(13, 19, 37, 0.45) 0%, #020204 100%)",
          zIndex: 0
        }}
      />

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
          style={{ transformOrigin: "center" }}
        >
          <Link to="/" className="auth-logo">MOVIEMAX</Link>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Start your premium entertainment journey.</p>

          <form onSubmit={handleSubmit(onSubmit, onError)} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <motion.input
                type="text"
                className={`form-input ${errors.name ? "error" : ""}`}
                placeholder="John Doe"
                {...register("name", { required: "Name is required", minLength: { value: 2, message: "Name too short" } })}
                whileFocus={{ scale: 1.015, borderColor: "var(--color-accent-primary)" }}
                transition={{ duration: 0.2 }}
              />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <motion.input
                type="email"
                className={`form-input ${errors.email ? "error" : ""}`}
                placeholder="your@email.com"
                {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Please enter a valid email address" } })}
                whileFocus={{ scale: 1.015, borderColor: "var(--color-accent-primary)" }}
                transition={{ duration: 0.2 }}
              />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <PasswordInput
                className={`${errors.password ? "error" : ""}`}
                placeholder="At least 6 characters"
                {...register("password", { required: "Password is required", minLength: { value: 6, message: "Minimum 6 characters" } })}
              />
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary btn-lg auth-btn"
              disabled={loading}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </motion.button>
          </form>

          {(!googleClientId || googleClientId === "your_google_client_id_here") ? (
            <div className="google-auth-error" style={{
              marginTop: "20px",
              padding: "12px",
              borderRadius: "4px",
              background: "rgba(255, 30, 66, 0.1)",
              border: "1px solid rgba(255, 30, 66, 0.3)",
              color: "#ff6b6b",
              fontSize: "13px",
              textAlign: "center",
              lineHeight: "1.4"
            }}>
              <strong>Google Sign-Up Unavailable:</strong> VITE_GOOGLE_CLIENT_ID is not configured.
            </div>
          ) : (
            <>
              <div className="auth-divider" style={{ justifyContent: "center" }}>
                <span className="auth-divider-text" style={{ letterSpacing: "1px" }}>-------- OR --------</span>
              </div>

              <div className="auth-google-btn">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    setLoading(true);
                    try {
                      await googleLogin(credentialResponse.credential);
                      setIsSuccess(true);
                      setTimeout(() => {
                        navigate("/");
                        toast.success("Welcome!");
                      }, 1500);
                    } catch (err) {
                      triggerShake();
                      toast.error(err.response?.data?.message || "Google registration failed");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onError={() => {
                    triggerShake();
                    toast.error("Google sign-up failed");
                  }}
                  size="large"
                  theme="filled_black"
                  text="signup_with"
                  shape="rectangular"
                />
              </div>
            </>
          )}

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
