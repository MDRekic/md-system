import { useState } from "react";
import { authApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await authApi.login(email, password);
      login(res.data.data); // { token, user }
      navigate("/calendar");
    } catch (err) {
      setError(err.response?.data?.message || "Login fehlgeschlagen");
    }
  };

  return (
    <div className="login-page">
      <h1>COMP4 Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Anmelden</button>
      </form>
    </div>
  );
};

export default LoginPage;
