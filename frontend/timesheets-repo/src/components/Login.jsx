import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock, faEnvelope, faLock, faEye, faEyeSlash,
  faCircleExclamation, faChartLine,
  faUserTie, faClipboardCheck, faCalculator, faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import loginBg from "../assets/login-bg.svg";

const Login = ({ onLogin, onForgotPassword }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    fetch("http://localhost:8000/api/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: username, password: password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else onLogin(data);
      })
      .catch(() => setError("Could not connect to server"));
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "0.9rem",
    outline: "none",
    background: "#fff",
    color: "#1a202c",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    /*
     * Key fix: the outer wrapper is the scroll container.
     * On mobile we stack column, let everything flow naturally,
     * and scroll the whole page — no clipped inner panels.
     */
    <div style={{
      display: "flex",
      minHeight: "100vh",
      fontFamily: "system-ui, sans-serif",
      flexDirection: isMobile ? "column" : "row",
      /* No overflow:hidden anywhere — let the browser handle scroll */
    }}>

      {/* ── LEFT / TOP PANEL – white form ── */}
      <div style={{
        width: isMobile ? "100%" : "45%",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: isMobile ? "flex-start" : "center",
        padding: isMobile ? "2.5rem 1.5rem 2rem" : "3rem 4rem",
        boxSizing: "border-box",
        /* No maxHeight, no overflowY — panel grows with content */
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: isMobile ? "1.5rem" : "2.5rem" }}>
          <div style={{
            width: isMobile ? 36 : 40,
            height: isMobile ? 36 : 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #00789A, #2DB5AA)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: isMobile ? "0.9rem" : "1rem",
          }}>
            <FontAwesomeIcon icon={faClock} />
          </div>
          <span style={{ fontWeight: 700, fontSize: isMobile ? "1rem" : "1.2rem", color: "#1a202c" }}>TimeDime</span>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: isMobile ? "1.5rem" : "2rem", fontWeight: 700, color: "#1a202c", marginBottom: "6px" }}>
          Sign in
        </h1>
        <p style={{ fontSize: isMobile ? "0.8rem" : "0.875rem", color: "#718096", marginBottom: isMobile ? "1.5rem" : "2rem" }}>
          Welcome back, enter your details below
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#4a5568", marginBottom: "6px" }}>
              Email address
            </label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                color: "#a0aec0", fontSize: "0.85rem",
              }}>
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <input
                type="text"
                placeholder="example@fdm.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                style={{ ...inputStyle, paddingLeft: "36px" }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4a5568" }}>Password</label>
              <button
                type="button"
                onClick={onForgotPassword}
                style={{ background: "none", border: "none", fontSize: "0.8rem", color: "#00789A", cursor: "pointer", padding: 0, fontWeight: 500 }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                color: "#a0aec0", fontSize: "0.85rem",
              }}>
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ ...inputStyle, paddingLeft: "36px", paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#a0aec0", padding: 0,
                }}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: "8px",
              padding: "10px 14px", marginBottom: "1rem",
              display: "flex", alignItems: "center", gap: "8px",
              fontSize: isMobile ? "0.78rem" : "0.85rem", color: "#c53030",
            }}>
              <FontAwesomeIcon icon={faCircleExclamation} />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            style={{
              width: "100%", padding: "12px",
              background: "linear-gradient(90deg, #00789A 0%, #2DB5AA 100%)",
              color: "#fff", border: "none", borderRadius: "8px",
              fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
              marginTop: "0.5rem", letterSpacing: "0.01em",
            }}
          >
            Sign in
          </button>
        </form>
      </div>

      {/* ── RIGHT PANEL – desktop only, dark teal with SVG ── */}
      {!isMobile && (
        <div style={{
          width: "55%",
          backgroundImage: `url(${loginBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#00789A",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "3rem",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Top right help text */}
          <div style={{
            position: "absolute", top: "24px", right: "28px",
            display: "flex", alignItems: "center", gap: "6px",
            color: "rgba(255,255,255,0.8)", fontSize: "0.85rem",
          }}>
            <FontAwesomeIcon icon={faClock} style={{ fontSize: "0.9rem" }} />
            <span>TimeDime</span>
          </div>

          {/* Feature card */}
          <div style={{
            background: "rgba(255,255,255,0.97)",
            borderRadius: "16px",
            padding: "1.75rem",
            width: "100%",
            maxWidth: "400px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            marginBottom: "2rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <div style={{ fontWeight: 700, fontSize: "1.15rem", color: "#1a202c", lineHeight: 1.3 }}>
                One platform, Every role
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: "12px",
                background: "linear-gradient(135deg, #00789A, #2DB5AA)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "1.2rem", flexShrink: 0,
              }}>
                <FontAwesomeIcon icon={faChartLine} />
              </div>
            </div>

            <p style={{ fontSize: "0.82rem", color: "#718096", marginBottom: "1.25rem", lineHeight: 1.6 }}>
              TimeDime brings everyone together at FDM.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { icon: faUserTie,        label: "Consultants",   desc: "Log and submit weekly timesheets" },
                { icon: faClipboardCheck, label: "Line Managers", desc: "Review and approve timesheets" },
                { icon: faCalculator,     label: "Finance",       desc: "Calculate pay from approved hours" },
                { icon: faShieldHalved,   label: "Admins",        desc: "Manage users other settings" },
              ].map(({ icon, label, desc }) => (
                <div key={label} style={{
                  background: "#f7fafa", borderRadius: "10px", padding: "12px",
                  display: "flex", flexDirection: "column", gap: "6px",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "8px",
                    background: "linear-gradient(135deg, #00789A22, #2DB5AA33)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#00789A", fontSize: "0.9rem",
                  }}>
                    <FontAwesomeIcon icon={icon} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#1a202c" }}>{label}</div>
                  <div style={{ fontSize: "0.74rem", color: "#718096", lineHeight: 1.4 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom tagline */}
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.9)" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px" }}>Built for FDM</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.75, maxWidth: "320px", lineHeight: 1.6 }}>
              Our way of helping you track your time. Time is money so why not use TimeDime?
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM BANNER – extra info, scrollable below the form ── */}
      {isMobile && (
        <div style={{
          width: "100%",
          background: "linear-gradient(135deg, #00789A, #2DB5AA)",
          padding: "2rem 1.5rem",
          boxSizing: "border-box",
          color: "rgba(255,255,255,0.95)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            One Platform, Every Role
          </div>
          <p style={{ fontSize: "0.83rem", marginBottom: "1.5rem", lineHeight: 1.6, maxWidth: "320px", margin: "0 auto 1.5rem" }}>
            TimeDime brings everyone at FDM together. Consultants log hours, managers review, finance calculates pay, and admins manage users.
          </p>

          {/* Mini role grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxWidth: "340px", margin: "0 auto" }}>
            {[
              { icon: faUserTie,        label: "Consultants",   desc: "Log & submit timesheets" },
              { icon: faClipboardCheck, label: "Line Managers", desc: "Review & approve" },
              { icon: faCalculator,     label: "Finance",       desc: "Calculate pay" },
              { icon: faShieldHalved,   label: "Admins",        desc: "Manage users" },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: "10px",
                padding: "12px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                backdropFilter: "blur(4px)",
              }}>
                <FontAwesomeIcon icon={icon} style={{ fontSize: "1.1rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.78rem" }}>{label}</div>
                <div style={{ fontSize: "0.7rem", opacity: 0.85, lineHeight: 1.4 }}>{desc}</div>
              </div>
            ))}
          </div>

          <p style={{ marginTop: "1.5rem", fontSize: "0.78rem", opacity: 0.7 }}>
            Time is money — so why not use TimeDime?
          </p>
        </div>
      )}
    </div>
  );
};

export default Login;