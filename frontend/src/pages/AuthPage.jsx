import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import "./AuthPage.css";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "tenant",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTabToggle = (loginState) => {
    if (isLogin !== loginState) {
      setIsLogin(loginState);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let userData;

      if (isLogin) {
        const response = await authService.login(
          formData.email,
          formData.password
        );
        userData = response.user;
      } else {
        const response = await authService.register(formData);
        userData = response.user;
      }

      // Dynamic Routing Based on Role
      switch (userData.role) {
        case "landlord":
          navigate("/landlord/dashboard");
          break;
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "tenant":
        default:
          navigate("/dashboard");
          break;
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        "An unexpected error occurred";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Side Branding */}
      <div className="auth-branding">
        <div className="branding-content">
          <h1 className="branding-title">VinHousing</h1>
          <p className="branding-subtitle">
            Find your perfect home near campus with VinUni's trusted housing network.
          </p>
        </div>
      </div>

      {/* Right Side Form */}
      <div className="auth-form-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
            <p>
              {isLogin
                ? "Enter your credentials to access your account."
                : "Join us today and explore new listings."}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? "active" : ""}`}
              onClick={() => handleTabToggle(true)}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${!isLogin ? "active" : ""}`}
              onClick={() => handleTabToggle(false)}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label htmlFor="full_name" className="form-label">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    className="form-input"
                    placeholder="e.g. John Doe"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="form-input"
                    placeholder="e.g. 0912345678"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="role" className="form-label">
                    I am a...
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="form-select"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="tenant">Tenant (Looking for housing)</option>
                    <option value="landlord">Landlord (Listing property)</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? <div className="spinner"></div> : isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
