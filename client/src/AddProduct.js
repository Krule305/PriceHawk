import Modal from "react-modal";
import { useState, useEffect } from "react";
import axios from "axios";
import { FiX } from "react-icons/fi";
import "./AddProduct.css";

Modal.setAppElement("#root");

export default function AddProduct({ isOpen, onClose, onSave, initialData }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [urls, setUrls] = useState([""]);
  const [scrapedData, setScrapedData] = useState({});
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCategory(initialData.category || "");
      setTargetPrice(initialData.targetPrice || "");
      setUrls(initialData.urls || [""]);
      setScrapedData({
        imageUrl: initialData.imageUrl || "",
        price: initialData.scrapedPrice || "",
      });
    } else if (isOpen) {
      setName("");
      setCategory("");
      setTargetPrice("");
      setUrls([""]);
      setScrapedData({});
    }
  }, [initialData, isOpen]);

  const scrapeAllUrls = async (urlList) => {
    setIsScraping(true);
    try {
      const res = await axios.post("http://localhost:5000/api/scrape-product", {
        urls: urlList,
      });
      setScrapedData(res.data);
    } catch (err) {
      console.error("Greška kod scrapanja:", err);
    } finally {
      setIsScraping(false);
    }
  };

  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);

    const validUrls = newUrls.filter((url) => url.startsWith("http"));
    if (validUrls.length) {
      scrapeAllUrls(validUrls);
    }
  };

  const handleAddUrl = () => {
    setUrls([...urls, ""]);
  };

  const handleRemoveUrl = (index) => {
    if (urls.length <= 1) return;
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
    const validUrls = newUrls.filter((url) => url.startsWith("http"));
    if (validUrls.length) {
      scrapeAllUrls(validUrls);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !urls[0].trim()) {
      alert("Naziv i barem jedan URL su obavezni.");
      return;
    }
    if (isScraping) {
      alert("Pričekaj da scraping završi.");
      return;
    }

    const newProduct = {
      name,
      category,
      targetPrice: parseFloat(targetPrice),
      urls: urls.filter(Boolean),
      imageUrl: scrapedData?.imageUrl || null,
      scrapedPrice: scrapedData?.price || null,
      createdAt: initialData?.createdAt || new Date(),
    };

    if (initialData?.id) {
      newProduct.id = initialData.id;
    }

    onSave(newProduct);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Dodaj proizvod"
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      <h2>{initialData ? "Uredi proizvod" : "Dodaj novi proizvod"}</h2>

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
              >
                <FiX size={18} />
              </button>
            )}
          </div>
        ))}
        <button onClick={handleAddUrl} className="add-url">+ Dodaj još jedan URL</button>
      </div>

      <div className="form-section">
        <label>Naziv proizvoda:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="form-section">
        <label>Kategorija:</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">-- Odaberi --</option>
          <option value="Elektronika">Elektronika</option>
          <option value="Odjeća/obuća">Odjeća/obuća</option>
          <option value="Kozmetika">Kozmetika</option>
          <option value="Sport">Sport</option>
          <option value="Knjige">Knjige</option>
          <option value="Dodaci">Dodaci</option>
          <option value="Ostalo">Ostalo</option>
        </select>
      </div>

      <div className="form-section">
        <label>Željena cijena (€):</label>
        <input
          type="number"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
        />
      </div>

      {scrapedData.price && (
        <p className="scraped-price">
          Najniža pronađena cijena: <strong>{scrapedData.price.toFixed(2)} €</strong>
        </p>
      )}

      {scrapedData.imageUrl && (
        <div className="image-preview">
          <label>Prepoznata slika:</label>
          <img src={scrapedData.imageUrl} alt="Scrapana" />
        </div>
      )}

      <div className="modal-footer">
        <button onClick={onClose} className="cancel-btn">Odustani</button>
        <button onClick={handleSave} className="save-btn" disabled={isScraping}>
          {isScraping ? "Čekam scraping..." : "Spremi"}
        </button>
      </div>
    </Modal>
  );
}
