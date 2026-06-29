import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/common/PasswordInput";
import "../css/Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg === "Please verify your email first") {
        navigate("/verify-otp", { state: { email: data.email } });
        toast.error("Email not verified. Please enter the OTP sent to your email.");
      } else {
        toast.error(msg || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card glass">
          <Link to="/" className="auth-logo">MOVIEMAX</Link>
          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">Welcome back! Enter your credentials.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-input ${errors.email ? "error" : ""}`}
                placeholder="your@email.com"
                {...register("email", { required: "Email is required", pattern: /^\S+@\S+$/i })}
              />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <PasswordInput
                className={`${errors.password ? "error" : ""}`}
                placeholder="Enter your password"
                {...register("password", { required: "Password is required" })}
              />
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" {...register("rememberMe")} />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
