import { FaTrash, FaEdit } from "react-icons/fa";

export default function ProductCard({ product, onEdit, onDelete }) {
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

  const formattedDate =
    createdAt && typeof createdAt.toDate === "function"
      ? createdAt.toDate().toLocaleDateString()
      : "Nepoznat datum";

  return (
    <div
      style={styles.card}
      onClick={() => onEdit && onEdit(product)}
    >
      <div style={styles.imageContainer}>
        <img
          src={imageUrl || "https://via.placeholder.com/250x180?text=Slika"}
          alt={typeof name === "string" ? name : "Proizvod"}
          style={styles.image}
        />
      </div>

      {/* Uredi (gore desno) */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onEdit && onEdit(product);
        }}
        style={styles.editIcon}
        title="Uredi proizvod"
      >
        <FaEdit size={18} color="#1976d2" />
      </div>

      <div style={styles.info}>
        <h4>{typeof name === "string" ? name : "Nepoznato ime"}</h4>
        <p><strong>Trgovina:</strong> {getShopName(url)}</p>
        <p>
          <strong>URL:</strong>{" "}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {getShortUrl(url)}
          </a>
        </p>
        <p><strong>Dodano:</strong> {formattedDate}</p>

        {/* Željena cijena */}
        {!isNaN(parseFloat(targetPrice)) && (
          <p>
            <strong>Željena cijena:</strong>{" "}
            {parseFloat(targetPrice).toFixed(2)} €
          </p>
        )}

        {/* Obriši (dolje desno) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onDelete && onDelete(product.id);
          }}
          style={styles.trashIcon}
          title="Obriši proizvod"
        >
          <FaTrash size={18} color="#e53935" />
        </div>
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
    position: "relative",
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
    position: "relative",
  },
  trashIcon: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    padding: "4px",
    borderRadius: "5px",
    transition: "background-color 0.2s",
    cursor: "pointer",
  },
  editIcon: {
    position: "absolute",
    top: "10px",
    right: "10px",
    padding: "4px",
    borderRadius: "5px",
    transition: "background-color 0.2s",
    cursor: "pointer",
  },
};
