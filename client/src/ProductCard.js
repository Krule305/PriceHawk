import React from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi"; 
import "./ProductCard.css";

export default function ProductCard({ product, onEdit, onDelete }) {
  const {
    name,
    urls = [],
    targetPrice,
    scrapedPrice,
    createdAt,
    imageUrl,
  } = product;

  // Formatiranje datuma
  const formattedDate =
    createdAt && typeof createdAt.toDate === "function"
      ? createdAt.toDate().toLocaleDateString()
      : "Nepoznat datum";

  // Izdvajanje naziva trgovine iz URL-a
  const getShopName = (url) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return "Nepoznata trgovina";
    }
  };

  return (
    <div className="product-card">
      <div className="product-card-top">
        {/* Sekcija slike */}
        <div className="image-container">
          <img
            src={imageUrl || "https://via.placeholder.com/250x180?text=Slika"} // fallback ako nema slike
            alt={name || "Proizvod"}
            className="product-image"
          />
        </div>

        {/* Informacije o proizvodu */}
        <div className="product-info">
          <h2 className="product-name">{name || "Nepoznato ime"}</h2>
          <p className="product-date">Dodano: {formattedDate}</p>

          {/* Trenutna i željena cijena */}
          <div className="dual-price-box">
            <div className="price-block">
              <span className="price-label">Trenutna cijena:</span>
              <span className="price-value current">
                {typeof scrapedPrice === "number" ? `€ ${scrapedPrice.toFixed(2)}` : "N/A"}
              </span>
            </div>

            <div className="vertical-divider" />

            <div className="price-block">
              <span className="price-label">Željena cijena:</span>
              <span className="price-value desired">
                {typeof targetPrice === "number" ? `€ ${targetPrice.toFixed(2)}` : "N/A"}
              </span>
            </div>
          </div>

          {/* Lista trgovina */}
          {urls.length > 0 && (
            <div className="product-stores">
              <p>Praćene trgovine:</p>
              <ul className="store-list">
                {urls.map((url, index) => (
                  <li key={index}>
                    <a href={url} target="_blank" rel="noreferrer">
                      {getShopName(url)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Gumbi akcija */}
      <div className="product-card-actions">
        <button className="icon-btn" onClick={() => onEdit(product)}>
          <FiEdit2 size={18} />
        </button>
        <button className="icon-btn danger" onClick={() => onDelete(product.id)}>
          <FiTrash2 size={18} />
        </button>
      </div>
    </div>
  );
}