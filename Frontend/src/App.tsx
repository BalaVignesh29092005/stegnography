// App.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import SignIn from "./components/Auth/SignIn";
import SignUp from "./components/Auth/SignUp";
import ChatApp from "./components/ChatApp";

export interface User {
  id: string;
  firstName: string;
  username: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);

  // Check session on initial load
  useEffect(() => {
    axios
      .get("http://localhost:5000/me", { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Logout / Sign out
  const handleSignOut = () => {
    axios
      .post("http://localhost:5000/logout", {}, { withCredentials: true })
      .then(() => setUser(null))
      .catch((err) => console.error("Logout failed:", err));
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "20px",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return showSignUp ? (
      <SignUp onSignUp={() => setShowSignUp(false)} />
    ) : (
      <SignIn
        onSignIn={(loggedUser) => setUser(loggedUser)}
        onSwitchToSignUp={() => setShowSignUp(true)}
      />
    );
  }

  return <ChatApp user={user} onSignOut={handleSignOut} />;
};

export default App;
