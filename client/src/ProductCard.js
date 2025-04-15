// ProductCard.js

export default function ProductCard({ product, onEdit }) {
    const {
      name,
      url,
      targetPrice,
      createdAt,
      imageUrl,
    } = product;
  
    const getShopName = (url) => {
      try {
        return new URL(url).hostname.replace("www.", "");
      } catch {
        return "Nepoznata trgovina";
      }
    };
  
    const getShortUrl = (url) => {
      try {
        const u = new URL(url);
        return `${u.hostname}/${u.pathname.split("/").slice(1, 3).join("/")}`;
      } catch {
        return url;
      }
    };
  
    const formattedDate = createdAt?.toDate?.().toLocaleDateString?.() || "";
  
    return (
      <div
        style={styles.card}
        onClick={() => onEdit && onEdit(product)}
      >
        <div style={styles.imageContainer}>
          <img
            src={imageUrl || "https://via.placeholder.com/250x180?text=Slika"}
            alt={name}
            style={styles.image}
          />
        </div>
        <div style={styles.info}>
          <h4>{name}</h4>
          <p><strong>Trgovina:</strong> {getShopName(url)}</p>
          <p>
            <strong>URL:</strong>{" "}
            <a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              {getShortUrl(url)}
            </a>
          </p>
          <p><strong>Dodano:</strong> {formattedDate}</p>
          {targetPrice && (
            <p><strong>Željena cijena:</strong> {parseFloat(targetPrice).toFixed(2)} €</p>
          )}
        </div>
      </div>
    );
  }
  
  const styles = {
    card: {
      width: "250px",
      border: "1px solid #ccc",
      borderRadius: "10px",
      overflow: "hidden",
      backgroundColor: "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      textAlign: "left",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      cursor: "pointer",
    },
    imageContainer: {
      height: "180px",
      backgroundColor: "#f0f0f0",
    },
    image: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    info: {
      padding: "1rem",
      fontSize: "0.95rem",
      lineHeight: "1.5",
    },
  };
  