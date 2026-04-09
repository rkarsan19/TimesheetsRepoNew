import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import loginBg from "../assets/login-bg.svg";

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/forgot-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0 vh-100">
      <div className="row g-0 h-100">

        {/* Left panel */}
        <div
          className="col-6 d-flex flex-column p-4 position-relative"
          style={{
            backgroundImage: `url(${loginBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "#0d7a7a",
          }}
        >
          <div className="d-flex align-items-center gap-2 text-white">
            <div
              className="rounded-circle border border-white border-2 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 46, height: 46 }}
            >
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div>
              <div className="fw-bold lh-1" style={{ fontSize: "1.3rem" }}>TimeDime</div>
              <div className="opacity-75" style={{ fontSize: "0.7rem" }}>
                FDM's time-tracking web application for consultants
              </div>
            </div>
          </div>
          <div
            className="position-absolute bottom-0 end-0 m-3 rounded-circle border border-white d-flex align-items-center justify-content-center text-white opacity-50"
            style={{ width: 36, height: 36 }}
          >
            <FontAwesomeIcon icon={faClock} />
          </div>
        </div>

        {/* Right panel */}
        <div
          className="col-6 d-flex flex-column align-items-center justify-content-center position-relative"
          style={{ background: "linear-gradient(135deg, #b2e8e0 0%, #d4f5ef 55%, #e8faf7 100%)" }}
        >
          <h1 className="fw-normal mb-4" style={{ color: "#0d9e9e", fontSize: "2.8rem" }}>
            Reset Password
          </h1>

          <div
            className="rounded-3 p-4 shadow w-100"
            style={{ backgroundColor: "#00a896", maxWidth: "400px" }}
          >
            {!submitted ? (
              <>
                <h2 className="text-white fw-bold mb-2">Forgot password?</h2>
                <p className="text-white mb-4" style={{ opacity: 0.85, fontSize: "0.9rem" }}>
                  Enter your email and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="input-group mb-3 rounded-3 overflow-hidden">
                    <span className="input-group-text bg-white border-0 text-secondary">
                      <FontAwesomeIcon icon={faEnvelope} />
                    </span>
                    <input
                      type="email"
                      className="form-control border-0 shadow-none"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      autoComplete="email"
                    />
                  </div>

                  {error && (
                    <div
                      className="mb-3 px-3 py-2 rounded-3 text-white"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)", fontSize: "0.875rem" }}
                    >
                      ❌ {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn w-100 text-white fw-semibold mb-3"
                    style={{ backgroundColor: "#a8dfe8" }}
                    disabled={loading}
                  >
                    {loading ? "Sending…" : "Send Reset Link"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-link text-white p-0 text-decoration-underline"
                    onClick={onBack}
                  >
                    Back to login
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-white fw-bold mb-2">Check your email</h2>
                <p className="text-white mb-4" style={{ opacity: 0.85, fontSize: "0.9rem" }}>
                  If <strong>{email}</strong> is registered, a reset link has been sent. It expires in 1 hour.
                </p>
                <button
                  type="button"
                  className="btn w-100 fw-semibold"
                  style={{ backgroundColor: "#a8dfe8", color: "#fff" }}
                  onClick={onBack}
                >
                  Back to login
                </button>
              </>
            )}
          </div>

          <div
            className="position-absolute bottom-0 end-0 m-3 rounded-circle border d-flex align-items-center justify-content-center opacity-50"
            style={{ width: 34, height: 34, borderColor: "#0d9e9e", color: "#0d9e9e" }}
          >
            <FontAwesomeIcon icon={faClock} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
