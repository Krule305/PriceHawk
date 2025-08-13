import Modal from "react-modal";
import { useState, useEffect } from "react";
import axios from "axios";
import { FiX } from "react-icons/fi";
import "./AddProduct.css";

Modal.setAppElement("#root");

const API = (process.env.REACT_APP_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

export default function AddProduct({ isOpen, onClose, onSave, initialData }) {
  // Stanja za formu
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [urls, setUrls] = useState([""]);
  const [scrapedData, setScrapedData] = useState({});
  const [isScraping, setIsScraping] = useState(false);

  // Postavljanje početnih vrijednosti kod otvaranja ili uređivanja
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCategory(initialData.category || "");
      setTargetPrice(initialData.targetPrice ?? "");
      setUrls(initialData.urls?.length ? initialData.urls : [""]);
      setScrapedData({
        imageUrl: initialData.imageUrl || "",
        price: initialData.scrapedPrice || "",
        bestUrl: initialData.bestUrl || "",
      });
    } else if (isOpen) {
      setName("");
      setCategory("");
      setTargetPrice("");
      setUrls([""]);
      setScrapedData({});
    }
  }, [initialData, isOpen]);

  // Funkcija za scraping svih URL-ova
  const scrapeAllUrls = async (urlList) => {
    setIsScraping(true);
    try {
      const clean = (urlList || [])
        .map((u) => (u || "").trim())
        .filter((u) => /^https?:\/\//i.test(u));

      if (!clean.length) {
        setScrapedData({});
        return;
      }

      const res = await axios.post(`${API}/api/scrape`, { urls: clean });
      const arr = Array.isArray(res.data) ? res.data : [];
      const valid = arr.filter((x) => x && x.price != null);

      if (!valid.length) {
        setScrapedData({});
        return;
      }

      const lowest = valid.reduce((m, c) => (c.price < m.price ? c : m), valid[0]);
      const firstImage = valid.find((v) => !!v.imageUrl)?.imageUrl || null;

      setScrapedData({
        price: lowest.price,
        imageUrl: firstImage,
        bestUrl: lowest.url || clean[0],
      });
    } catch (err) {
      console.error("Greška kod scrapanja:", err?.message || err);
      setScrapedData({});
    } finally {
      setIsScraping(false);
    }
  };

  // Promjena URL-a u inputu
  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);

    const validUrls = newUrls.filter((url) => url.startsWith("http"));
    if (validUrls.length) scrapeAllUrls(validUrls);
  };

  // Dodavanje novog URL polja
  const handleAddUrl = () => setUrls((prev) => [...prev, ""]);

  // Uklanjanje URL polja
  const handleRemoveUrl = (index) => {
    if (urls.length <= 1) return;
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);

    const validUrls = newUrls.filter((url) => url.startsWith("http"));
    if (validUrls.length) scrapeAllUrls(validUrls);
  };

  // Spremanje proizvoda
  const handleSave = () => {
    if (!name.trim() || !urls[0].trim()) {
      alert("Naziv i barem jedan URL su obavezni.");
      return;
    }
    if (isScraping) {
      alert("Pričekaj da scraping završi.");
      return;
    }

    const parsedTarget = targetPrice === "" ? null : parseFloat(targetPrice);

    const newProduct = {
      name: name.trim(),
      category: category.trim(),
      targetPrice: Number.isFinite(parsedTarget) ? parsedTarget : null,
      urls: urls.map((u) => (u || "").trim()).filter(Boolean),
      imageUrl: scrapedData?.imageUrl || null,
      scrapedPrice: scrapedData?.price ?? null,
      bestUrl: scrapedData?.bestUrl || null,
      createdAt: initialData?.createdAt || new Date(),
    };

    if (initialData?.id) newProduct.id = initialData.id;

    onSave(newProduct);
  };

  // Ako modal nije otvoren, ništa ne rendera
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Dodaj proizvod"
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      <div className="modal-body">
        <h2>{initialData ? "Uredi proizvod" : "Dodaj novi proizvod"}</h2>

        {/* Polje za URL-ove */}
        <div className="form-section">
          <label>URL proizvoda:</label>
          {urls.map((url, i) => (
            <div key={i} className="url-row">
              <input
                value={url}
                onChange={(e) => handleUrlChange(i, e.target.value)}
                placeholder="https://example.com/proizvod"
              />
              {urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(i)}
                  className="remove-url"
                  aria-label="Ukloni URL"
                  title="Ukloni URL"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddUrl} className="add-url">
            + Dodaj još jedan URL
          </button>
        </div>

        {/* Naziv */}
        <div className="form-section">
          <label>Naziv proizvoda:</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        {/* Kategorija */}
        <div className="form-section">
          <label>Kategorija:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">-- Odaberi --</option>
            <option value="Elektronika">Elektronika</option>
            <option value="Odjeća/obuća">Odjeća/obuća</option>
            <option value="Kozmetika">Kozmetika</option>
            <option value="Sport">Sport</option>
            <option value="Knjige">Knjige</option>
            <option value="Dodaci za dom">Dodaci za dom</option>
            <option value="Razno">Razno</option>
          </select>
        </div>

        {/* Željena cijena */}
        <div className="form-section">
          <label>Željena cijena (€):</label>
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            min="0"
            step="0.01"
            inputMode="decimal"
          />
        </div>

        {/* Prikaz scrapane cijene */}
        {typeof scrapedData.price === "number" && (
          <p className="scraped-price">
            Najniža pronađena cijena: <strong>{scrapedData.price.toFixed(2)} €</strong>
          </p>
        )}

        {/* Prikaz slike */}
        {scrapedData.imageUrl && (
          <div className="image-preview">
            <label>Prepoznata slika:</label>
            <img src={scrapedData.imageUrl} alt="Scrapana" />
          </div>
        )}

        {/* Gumbi */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="cancel-btn">
            Odustani
          </button>
          <button type="button" onClick={handleSave} className="save-btn" disabled={isScraping}>
            {isScraping ? "Čekam scraping..." : "Spremi"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
