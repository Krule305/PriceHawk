// Register.js
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { useNavigate, Link } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // upis u firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username: username,
        createdAt: new Date(),
      });

      console.log("Korisnik uspješno upisan u Firestore!");
      toast.success("Uspješna registracija!");
      navigate("/");
    } catch (error) {
      console.error("Greška pri registraciji:", error);
      toast.error(`Greška: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <h2>Registracija</h2>
      <input
        type="text"
        placeholder="Korisničko ime"
        onChange={(e) => setUsername(e.target.value)}
        required
      />
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
      <button type="submit">Registriraj se</button>
      <p>
        Već imate račun? <Link to="/login">Prijavi se</Link>
      </p>
    </form>
  );
}
