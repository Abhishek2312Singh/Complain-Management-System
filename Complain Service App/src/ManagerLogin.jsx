import React, { useState } from "react";

const ManagerLogin = ({ onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    setError("");
    setLoggingIn(true);
    try {
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password
        })
      });
      if (!response.ok) {
        throw new Error(`Login failed with status ${response.status}`);
      }
      const data = await response.text();
      const token = typeof data === "string" ? data.trim() : null;
      if (token) {
        localStorage.setItem("authToken", token);
        setUsername("");
        setPassword("");
        if (onLoginSuccess) {
          onLoginSuccess(token);
        }
        if (onClose) {
          onClose();
        }
      } else {
        setError("Login succeeded but no token was returned by the server.");
      }
    } catch (err) {
      setError("Invalid username or password. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manager Login</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="manager-login-username">Username</label>
            <input
              id="manager-login-username"
              type="text"
              required
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="manager-login-password">Password</label>
            <input
              id="manager-login-password"
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div style={{ color: "#b91c1c", fontWeight: 600, fontSize: "0.9rem" }}>
              {error}
            </div>
          )}
          <div className="modal-actions">
            <button type="submit" disabled={loggingIn}>
              {loggingIn ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagerLogin;

