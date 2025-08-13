import { useNavigate } from "react-router-dom";
import "./WelcomePage.css";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    // Dobrodošlica
    <div className="welcome-container">
      <div className="welcome-box">
        <h1>Dobrodošli u PriceTracker</h1>
        <p>
          Pratite cijene svojih omiljenih proizvoda iz više trgovina i budite
          prvi koji će saznati kada cijena padne ispod željene!
        </p>

        <div className="button-group">
          <button onClick={() => navigate("/login")}>Prijava</button>
          <button onClick={() => navigate("/register")}>Registracija</button>
        </div>
      </div>
    </div>
  );
}
