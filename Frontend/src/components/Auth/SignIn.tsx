import React, { useState, useEffect } from "react";
import axios from "axios";
import "./auth.css";

interface SignInProps {
  onSignIn: (user: any) => void;
  onSwitchToSignUp: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onSignIn, onSwitchToSignUp }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ Check session on load
  useEffect(() => {
    axios
      .get("http://localhost:5000/me", { withCredentials: true })
      .then((res) => onSignIn(res.data.user))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/login",
        { username, password },
        { withCredentials: true }
      );
      onSignIn(res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account?{" "}
        <span onClick={onSwitchToSignUp}>Sign Up</span>
      </p>
    </div>
  );
};

export default SignIn;
