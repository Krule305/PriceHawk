import Modal from "react-modal";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiX } from "react-icons/fi";
import "./AddProduct.css";

Modal.setAppElement("#root");

const API = (process.env.REACT_APP_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

export default function AddProduct({ isOpen, onClose, onSave, initialData }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [urls, setUrls] = useState([""]);

  const [scrapedData, setScrapedData] = useState({});
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState("");

  const scrapeTimer = useRef(null);
  const scrapeReqId = useRef(0);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCategory(initialData.category || "");
      setTargetPrice(initialData.targetPrice ?? "");
      setUrls(initialData.urls?.length ? initialData.urls : [""]);
      setScrapedData({
        imageUrl: initialData.imageUrl || "",
        price: initialData.scrapedPrice ?? null,
        bestUrl: initialData.bestUrl || "",
      });
      setScrapeMsg("");
      setIsScraping(false);
    } else if (isOpen) {
      setName("");
      setCategory("");
      setTargetPrice("");
      setUrls([""]);
      setScrapedData({});
      setScrapeMsg("");
      setIsScraping(false);
    }
  }, [initialData, isOpen]);

  const scrapeAllUrls = async (urlList, reqId) => {
    const clean = (urlList || [])
      .map((u) => (u || "").trim())
      .filter((u) => /^https?:\/\//i.test(u));

    if (!clean.length) {
      if (reqId === scrapeReqId.current) {
        setScrapedData({});
        setScrapeMsg("");
        setIsScraping(false);
      }
      return;
    }

    try {
      if (reqId === scrapeReqId.current) {
        setIsScraping(true);
        setScrapeMsg("Dohvaćam cijenu…");
      }

      const res = await axios.post(`${API}/api/scrape`, { urls: clean });

      if (reqId !== scrapeReqId.current) return;

      if (!Array.isArray(res.data)) {
        console.warn("[scrape] Neočekivan format (nije array):", res.data);
        setScrapedData({});
        setScrapeMsg("Nažalost, nije moguće dohvatiti cijenu za ovaj URL.");
        return;
      }

      const valid = res.data.filter((x) => x && x.price != null);
      if (!valid.length) {
        setScrapedData({});
        setScrapeMsg("Nažalost, nije moguće dohvatiti cijenu za ovaj URL.");
        return;
      }

      const lowest = valid.reduce((m, c) => (c.price < m.price ? c : m), valid[0]);
      const firstImage = valid.find((v) => !!v.imageUrl)?.imageUrl || null;

      setScrapedData({
        price: lowest.price,
        imageUrl: firstImage,
        bestUrl: lowest.url || clean[0],
      });
      setScrapeMsg("");
    } catch (err) {
      if (reqId !== scrapeReqId.current) return;
      console.error("Greška kod scrapanja:", err?.response?.data || err?.message || err);
      setScrapedData({});
      setScrapeMsg("Greška pri dohvaćanju cijene. Pokušaj drugi URL.");
    } finally {
      if (reqId === scrapeReqId.current) setIsScraping(false);
    }
  };

  const triggerScrapeDebounced = (urlsArray) => {
    const thisReq = ++scrapeReqId.current;
    clearTimeout(scrapeTimer.current);
    scrapeTimer.current = setTimeout(() => scrapeAllUrls(urlsArray, thisReq), 600);
  };

  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);

    setScrapedData({});
    setScrapeMsg("");

    const validUrls = newUrls.filter((u) => /^https?:\/\//i.test(u));
    if (validUrls.length) {
      setIsScraping(true);
      triggerScrapeDebounced(validUrls);
    } else {
      clearTimeout(scrapeTimer.current);
      scrapeReqId.current++;
      setIsScraping(false);
    }
  };

  const handleAddUrl = () => setUrls((prev) => [...prev, ""]);

  const handleRemoveUrl = (index) => {
    if (urls.length <= 1) return;
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);

    setScrapedData({});
    setScrapeMsg("");

    const validUrls = newUrls.filter((u) => /^https?:\/\//i.test(u));
    if (validUrls.length) {
      setIsScraping(true);
      triggerScrapeDebounced(validUrls);
    } else {
      clearTimeout(scrapeTimer.current);
      scrapeReqId.current++;
      setIsScraping(false);
    }
  };

  // Save
  const handleSave = () => {
    if (!name.trim() || !urls[0].trim()) {
      setScrapeMsg("Naziv i barem jedan URL su obavezni.");
      return;
    }
    if (isScraping) {
      setScrapeMsg("Pričekaj da scraping završi.");
      return;
    }
    if (typeof scrapedData.price !== "number") {
      setScrapeMsg("Ne možete spremiti bez važeće cijene.");
      return;
    }

    const parsedTarget = targetPrice === "" ? null : parseFloat(targetPrice);

    const newProduct = {
      name: name.trim(),
      category: (category || "").trim() || "Razno",
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

        {/* URL-ovi */}
        <div className="form-section">
          <label>URL proizvoda:</label>
          {urls.map((url, i) => (
            <div key={i} className="url-row">
              <input
                value={url}
                onChange={(e) => handleUrlChange(i, e.target.value)}
                onPaste={(e) => {
                  const v = (e.clipboardData || window.clipboardData).getData("text");
                  handleUrlChange(i, v);
                }}
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

        {/* Pronađena cijena */}
        {typeof scrapedData.price === "number" && (
          <p className="scraped-price">
            Najniža pronađena cijena: <strong>{scrapedData.price.toFixed(2)} €</strong>
          </p>
        )}

        {/* Slika */}
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
          <button
            type="button"
            onClick={handleSave}
            className={`save-btn ${isScraping || typeof scrapedData.price !== "number" ? "disabled" : ""}`}
            disabled={isScraping || typeof scrapedData.price !== "number"}
          >
            {isScraping ? "Čekam scraping..." : "Spremi"}
          </button>
        </div>

        {/* Poruke ispod gumba */}
        {isScraping && <div className="scrape-status info">Dohvaćam cijenu…</div>}
        {!isScraping && scrapeMsg && <div className="scrape-status error">{scrapeMsg}</div>}
      </div>
    </Modal>
  );
}
