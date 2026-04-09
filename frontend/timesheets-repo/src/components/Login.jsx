import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faUser, faLock } from "@fortawesome/free-solid-svg-icons";
import loginBg from "../assets/login-bg.svg";

const Login = ({ onLogin, onForgotPassword }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
        if (data.error) {
          setError(data.error);
        } else {
          onLogin(data);
        }
      })
      .catch(() => setError("Could not connect to server"));
  };

  return (
    <div className="container-fluid p-0 vh-100">
      <div className="row g-0 h-100">

        {/* ── LEFT PANEL ── */}
        <div
          className="col-6 d-flex flex-column p-4 position-relative"
          style={{
            backgroundImage: `url(${loginBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "#0d7a7a",
          }}
        >
          {/* Logo */}
          <div className="d-flex align-items-center gap-2 text-white">
            <div
              className="rounded-circle border border-white border-2 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 46, height: 46 }}
            >
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div>
              <div className="fw-bold lh-1" style={{ fontSize: "1.3rem" }}>
                TimeDime
              </div>
              <div className="opacity-75" style={{ fontSize: "0.7rem" }}>
                FDM's time-tracking web application for consultants
              </div>
            </div>
          </div>

          {/* Watermark – bottom right */}
          <div
            className="position-absolute bottom-0 end-0 m-3 rounded-circle border border-white d-flex align-items-center justify-content-center text-white opacity-50"
            style={{ width: 36, height: 36 }}
          >
            <FontAwesomeIcon icon={faClock} />
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div
          className="col-6 d-flex flex-column align-items-center justify-content-center position-relative"
          style={{
            background:
              "linear-gradient(135deg, #b2e8e0 0%, #d4f5ef 55%, #e8faf7 100%)",
          }}
        >
          {/* Welcome heading */}
          <h1
            className="fw-normal mb-4"
            style={{ color: "#0d9e9e", fontSize: "2.8rem" }}
          >
            Welcome
          </h1>

          {/* Login card */}
          <div
            className="rounded-3 p-4 shadow w-100"
            style={{ backgroundColor: "#00a896", maxWidth: "400px" }}
          >
            <h2 className="text-white fw-bold mb-4">Log in</h2>

            <form onSubmit={handleSubmit}>
              {/* Username */}
              <div className="input-group mb-3 rounded-3 overflow-hidden">
                <span className="input-group-text bg-white border-0 text-secondary">
                  <FontAwesomeIcon icon={faUser} />
                </span>
                <input
                  type="text"
                  className="form-control border-0 shadow-none"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>

              {/* Password */}
              <div className="input-group mb-3 rounded-3 overflow-hidden">
                <span className="input-group-text bg-white border-0 text-secondary">
                  <FontAwesomeIcon icon={faLock} />
                </span>
                <input
                  type="password"
                  className="form-control border-0 shadow-none"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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

              {/* Submit button */}
              <button
                type="submit"
                className="btn w-100 text-white fw-semibold mb-3"
                style={{ backgroundColor: "#a8dfe8" }}
              >
                Log in
              </button>

              {/* Forgot password */}
              <button
                type="button"
                className="btn btn-link text-white p-0 text-decoration-underline"
                onClick={onForgotPassword}
              >
                Forgot Password?
              </button>

      

            </form>
          </div>

          {/* Watermark – bottom right */}
          <div
            className="position-absolute bottom-0 end-0 m-3 rounded-circle border d-flex align-items-center justify-content-center opacity-50"
            style={{
              width: 34,
              height: 34,
              borderColor: "#0d9e9e",
              color: "#0d9e9e",
            }}
          >
            <FontAwesomeIcon icon={faClock} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
