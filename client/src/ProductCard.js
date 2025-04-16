export default function ProductCard({ product, onEdit, onDelete }) {
  const {
    name,
    urls,
    targetPrice,
    createdAt,
    imageUrl,
  } = product;

  const formattedDate =
    createdAt && typeof createdAt.toDate === "function"
      ? createdAt.toDate().toLocaleDateString()
      : "Nepoznat datum";

  const getShortUrl = (url) => {
    try {
      const u = new URL(url);
      return `${u.hostname}/${u.pathname.split("/").slice(1, 3).join("/")}`;
    } catch {
      return url;
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.imageContainer}>
        <img
          src={imageUrl || "https://via.placeholder.com/250x180?text=Slika"}
          alt={typeof name === "string" ? name : "Proizvod"}
          style={styles.image}
        />
      </div>

      <div style={styles.content}>
        <h4 style={{ marginBottom: "0.5rem" }}>
          {typeof name === "string" ? name : "Nepoznato ime"}
        </h4>
        <p><strong>Dodano:</strong> {formattedDate}</p>

        {!isNaN(parseFloat(targetPrice)) && (
          <p><strong>Željena cijena:</strong> {parseFloat(targetPrice).toFixed(2)} €</p>
        )}

        {Array.isArray(urls) && urls.length > 0 && (
          <div style={{ marginTop: "0.75rem" }}>
            <p style={{ marginBottom: "0.25rem" }}>
              <strong>Praćene trgovine:</strong>
            </p>
            <ul style={styles.urlList}>
              {urls.map((url, i) => (
                <li key={i} style={styles.urlItem}>
                  <a href={url} target="_blank" rel="noreferrer">
                    {getShortUrl(url)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <button onClick={() => onEdit && onEdit(product)} style={styles.editButton}>
          Uredi
        </button>
        <button onClick={() => onDelete && onDelete(product.id)} style={styles.deleteButton}>
          Obriši
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    width: "300px",
    height: "520px", // fiksna visina
    border: "1px solid #ccc",
    borderRadius: "10px",
    overflow: "hidden",
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "left",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  imageContainer: {
    height: "220px",
    backgroundColor: "white",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "scale-down",
  },
  content: {
    padding: "1rem",
    fontSize: "0.9rem",
    flex: 1,
    overflowY: "auto",
  },
  urlList: {
    paddingLeft: "1.2rem",
    margin: 0,
  },
  urlItem: {
    fontSize: "0.9rem",
    marginBottom: "4px",
    listStyleType: "disc",
  },
  actions: {
    padding: "0.75rem 1rem",
    borderTop: "1px solid #eee",
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
    backgroundColor: "#fafafa",
  },
  editButton: {
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    padding: "6px 12px",
    cursor: "pointer",
  },
  deleteButton: {
    backgroundColor: "#e53935",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    padding: "6px 12px",
    cursor: "pointer",
  },
};
