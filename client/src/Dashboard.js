import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import AddProduct from "./AddProduct";
import ProductCard from "./ProductCard";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { toast } from "react-toastify";
import { FiBell, FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import Modal from "react-modal";
import "./Dashboard.css";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Sve");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState([]);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const navigate = useNavigate();

  // Autentikacija + dohvat podataka
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUsername(docSnap.data().username);

        const productsRef = collection(db, "users", user.uid, "products");
        const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
          setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
        });

        return () => unsubscribeProducts();
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Promjena teme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Odjava
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // Dodavanje/uređivanje proizvoda
  const handleSaveProduct = async (product) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userProductsRef = collection(db, "users", user.uid, "products");

      if (product.id) {
        const docRef = doc(userProductsRef, product.id);
        const { id, ...updatedFields } = product;
        await updateDoc(docRef, updatedFields);
        toast.success("Proizvod je ažuriran!");
      } else {
        await addDoc(userProductsRef, { ...product, createdAt: new Date() });
        toast.success("Proizvod je uspješno dodan!");
      }

      setEditingProduct(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Greška pri spremanju proizvoda:", error);
      toast.error("Nešto je pošlo po zlu. Pokušaj ponovno.");
    }
  };

  // Brisanje proizvoda
  const handleDeleteProduct = async (productId) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const productRef = doc(db, "users", user.uid, "products", productId);
      await deleteDoc(productRef);
      toast.success("Proizvod je obrisan.");
    } catch (error) {
      console.error("Greška pri brisanju proizvoda:", error);
      toast.error("Brisanje nije uspjelo.");
    }
  };

  // Brojač po kategorijama
  const getCategoryCounts = () => {
    const counts = {};
    products.forEach((p) => {
      const cat = p.category || "Neodređeno";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    counts["Sve"] = products.length;
    return counts;
  };

  const categoryCounts = getCategoryCounts();
  const allCategories = ["Sve", ...new Set(products.map((p) => p.category || "Neodređeno"))];

  // Izračun obavijesti
  const alerts = products.filter(
    (p) =>
      typeof p.scrapedPrice === "number" &&
      typeof p.targetPrice === "number" &&
      p.scrapedPrice < p.targetPrice
  );

  const alertsToShow = alerts.filter((p) => !dismissedAlertIds.includes(p.id));
  const unreadCount = alertsToShow.length;

  if (loading) return <p>Učitavanje...</p>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-welcome">Pozdrav {username}!</h2>
        <div className="dashboard-actions">
          <button
            className="notification-btn"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            title="Obavijesti"
            aria-label="Obavijesti"
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>

          <button
            className="notification-btn"
            onClick={toggleTheme}
            title={theme === "dark" ? "Prebaci na svijetlu" : "Prebaci na tamnu"}
            aria-label="Promijeni temu"
            style={{ width: 36, height: 36 }}
          >
            {theme === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
          </button>

          <button className="logout-btn" onClick={handleLogout} title="Odjava" aria-label="Odjava">
            <FiLogOut size={18} />
          </button>
        </div>
      </div>

      {/* Modal obavijesti */}
      <Modal
        isOpen={isNotificationsOpen}
        onRequestClose={() => setIsNotificationsOpen(false)}
        contentLabel="Obavijesti"
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="modal-body">
          <div className="notif-panel-header">
            <h4>Obavijesti</h4>
            <button className="notif-close" onClick={() => setIsNotificationsOpen(false)}>✕</button>
          </div>

          {alertsToShow.length === 0 ? (
            <p className="notif-empty">Nema novih obavijesti.</p>
          ) : (
            alertsToShow.map((p) => {
              const shopUrl = p.bestUrl || (Array.isArray(p.urls) ? p.urls[0] : "");
              return (
                <div key={p.id} className="notification-card">
                  <div className="notif-main-content">
                    <div className="notif-card-top">
                      <div className="notif-name">{p.name || "Proizvod"}</div>
                    </div>

                    <div className="notif-prices-row">
                      <div className="price-block">
                        <span className="price-label">Trenutna cijena</span>
                        <span className="price-value current">€ {p.scrapedPrice.toFixed(2)}</span>
                      </div>
                      <div className="price-divider" />
                      <div className="price-block">
                        <span className="price-label">Željena cijena</span>
                        <span className="price-value target">€ {p.targetPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {shopUrl && (
                      <div className="notif-shop">
                        Trgovina:{" "}
                        <a href={shopUrl} target="_blank" rel="noreferrer">
                          {(() => {
                            try {
                              return new URL(shopUrl).hostname.replace(/^www\./, "");
                            } catch {
                              return shopUrl;
                            }
                          })()}
                        </a>
                      </div>
                    )}
                  </div>

                  <button
                    className="notif-remove"
                    title="Ukloni ovu obavijest"
                    aria-label="Ukloni obavijest"
                    onClick={() =>
                      setDismissedAlertIds((prev) => [...new Set([...prev, p.id])])
                    }
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Gornji dio dashboarda*/}
      <div className="dashboard-top">
        <div className="left-controls">
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="add-product-btn"
          >
            Dodaj novi proizvod
          </button>
        </div>

        <div className="right-controls">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Pretraži po nazivu..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearchTerm("")}
                aria-label="Obriši pretragu"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kategorije */}
      <div className="category-buttons">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`category-button ${selectedCategory === cat ? "active" : ""}`}
          >
            {cat} ({categoryCounts[cat] || 0})
          </button>
        ))}
      </div>

      {/* Grid proizvoda */}
      <div className="product-grid">
        {products
          .filter(
            (p) =>
              (selectedCategory === "Sve" || p.category === selectedCategory) &&
              (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
          )
          .map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={(p) => {
                setEditingProduct(p);
                setIsModalOpen(true);
              }}
              onDelete={(id) => setProductToDelete(id)}
            />
          ))}
      </div>

      {/* Modal za dodavanje/uređivanje */}
      <AddProduct
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        initialData={editingProduct}
      />

      {/* Modal potvrde brisanja */}
      <DeleteConfirmModal
        isOpen={!!productToDelete}
        onCancel={() => setProductToDelete(null)}
        onConfirm={async () => {
          await handleDeleteProduct(productToDelete);
          setProductToDelete(null);
        }}
      />
    </div>
  );
}
