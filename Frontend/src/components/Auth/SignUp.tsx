import React, { useState } from "react";
import axios from "axios";
import "./auth.css";

interface SignUpProps {
  onSignUp: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSignUp }) => {
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:5000/signup",
        { firstName, username, password },
        { withCredentials: true }
      );
      setSuccess("Account created! Please login.");
      setError("");
      onSignUp();
    } catch (err: any) {
      setError(err.response?.data?.message || "Sign up failed");
      setSuccess("");
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
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
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default SignUp;
