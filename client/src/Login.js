// Login.js
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Uspješna prijava!");
      navigate("/");
    } catch (error) {
      toast.error(`Greška: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Prijava</h2>
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Lozinka"
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Prijavi se</button>
      <p>
        Nemate račun? <Link to="/register">Registriraj se</Link>
      </p>
    </form>
  );
}
