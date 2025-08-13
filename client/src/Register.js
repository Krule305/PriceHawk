import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Obrada registracije
  const handleRegister = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        username: username.trim(),
        email: email.trim(),
        createdAt: new Date(),
      });

      navigate("/dashboard");
    } catch (err) {
      alert("Greška pri registraciji: " + (err?.message || "Pokušajte ponovno."));
    } finally {
      setSubmitting(false);
    }
  };

  // Render
  return (
    <div className="auth-container">
      <form onSubmit={handleRegister} className="auth-form" noValidate>
        <h2>Registracija</h2>

        <input
          type="text"
          placeholder="Korisničko ime"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email adresa"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          inputMode="email"
          required
        />

        <input
          type="password"
          placeholder="Lozinka"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        <button type="submit" disabled={submitting || !email || !password || !username}>
          {submitting ? "Registracija..." : "Registriraj se"}
        </button>

        <p className="auth-switch">
          Imate račun? <Link to="/login">Prijavite se</Link>
        </p>
      </form>
    </div>
  );
}
