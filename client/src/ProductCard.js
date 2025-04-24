export default function ProductCard({ product, onEdit, onDelete }) {
  const {
    name,
    urls = [],
    targetPrice,
    scrapedPrice,
    createdAt,
    imageUrl,
  } = product;

  const formattedDate =
    createdAt && typeof createdAt.toDate === "function"
      ? createdAt.toDate().toLocaleDateString()
      : "Nepoznat datum";

  const getShopName = (url) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return "Nepoznata trgovina";
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

      <div style={styles.info}>
        <div style={styles.topContent}>
          <p style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
            {typeof name === "string" ? name : "Nepoznato ime"}
          </p>

          <p>Dodano: {formattedDate}</p>
          <p>Željena cijena: {targetPrice?.toFixed(2)} €</p>
          {typeof scrapedPrice === "number" && (
            <p>Najniža cijena: {scrapedPrice.toFixed(2)} €</p>
          )}

          {urls.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              Praćene trgovine:
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginTop: "0.2rem" }}>
                {urls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "0.9rem", color: "#1976d2", textDecoration: "none" }}
                  >
                    {getShopName(url)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={styles.actions}>
          <button onClick={() => onEdit(product)} style={styles.editButton}>
            Uredi
          </button>
          <button onClick={() => onDelete(product.id)} style={styles.deleteButton}>
            Obriši
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    width: "250px",
    minHeight: "450px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    overflow: "hidden",
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
  },
  imageContainer: {
    height: "225px",
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    maxHeight: "185px",
    maxWidth: "100%",
    objectFit: "contain",
  },
  info: {
    padding: "1rem",
    fontSize: "0.95rem",
    lineHeight: "1.5",
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between", // rasporedi tekst gore, gumbe dolje
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "1rem",
  },
  editButton: {
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "0.4rem 0.8rem",
    borderRadius: "5px",
    cursor: "pointer",
  },
  deleteButton: {
    backgroundColor: "#e53935",
    color: "#fff",
    border: "none",
    padding: "0.4rem 0.8rem",
    borderRadius: "5px",
    cursor: "pointer",
  },
};