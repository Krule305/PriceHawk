// AddProduct.js
import { useEffect, useState } from "react";

export default function AddProduct({ isOpen, onClose, onSave, initialData }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [targetPrice, setTargetPrice] = useState("");

  // Kad god dobijemo nove početne podatke (kod uređivanja), popuni formu
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setUrl(initialData.url || "");
      setCategory(initialData?.category || "");
      setTargetPrice(initialData.targetPrice || "");
    } else {
      setName("");
      setUrl("");
      setCategory("");
      setTargetPrice("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !url) {
      alert("Naziv i URL su obavezni.");
      return;
    }

    const product = {
        name,
        url,
        category,
        targetPrice: targetPrice || null,
        createdAt: initialData?.createdAt || new Date(),
      };
      
      if (initialData?.id) {
        product.id = initialData.id;
      }

    onSave(product);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3>{initialData ? "Uredi proizvod" : "Dodaj proizvod"}</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Naziv proizvoda"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="url"
            placeholder="URL proizvoda"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={styles.input}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            style={styles.input}
          >
            <option value="">Odaberi kategoriju</option>
            <option value="Elektronika">Elektronika</option>
            <option value="Odjeća/obuća">Odjeća/obuća</option>
            <option value="Kozmetika">Kozmetika</option>
            <option value="Sport">Sport</option>
            <option value="Knjige">Knjige</option>
            <option value="Dodaci">Dodaci</option>
            <option value="Ostalo">Ostalo</option>
          </select>
          <input
            type="number"
            placeholder="Željena cijena (opcionalno)"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            style={styles.input}
          />
          <div style={styles.actions}>
            <button type="button" onClick={onClose}>
              Odustani
            </button>
            <button type="submit">
              {initialData ? "Spremi izmjene" : "Spremi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    padding: "2rem",
    borderRadius: "10px",
    width: "90%",
    maxWidth: "400px",
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    marginBottom: "1rem",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
  },
};
