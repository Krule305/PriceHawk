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
import { FiBell, FiLogOut, FiHelpCircle } from "react-icons/fi";
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
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [hideHelp, setHideHelp] = useState(() => localStorage.getItem("hideHelp") === "1");

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
  const rawCategories = [...new Set(products.map((p) => p.category || "Neodređeno"))];
  const sortedCategories = rawCategories
    .filter((cat) => cat !== "Sve" && cat !== "Razno")
    .sort((a, b) => a.localeCompare(b, "hr")); // abecedno sortiranje
  const allCategories = ["Sve", ...sortedCategories, "Razno"];

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

  // Filtrirani proizvodi + empty-state flagovi
  const visibleProducts = products.filter(
    (p) =>
      (selectedCategory === "Sve" || p.category === selectedCategory) &&
      (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );
  const hasAnyProducts = products.length > 0;

  return (
    <div className="dashboard-container">
      {/* ===== SEKCIJA 1: HEADER + KONTROLE + KATEGORIJE ===== */}
      <div className="stack-section section-inset">
        {/* RED 1: pozdrav (lijevo) + akcije (desno) */}
        <div className="header-row">
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

            <button className="logout-btn" onClick={handleLogout} title="Odjava" aria-label="Odjava">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>

        {/* RED: Dodaj lijevo | Kategorije centar | Search desno */}
        <div className="controls-row">
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="add-product-btn"
          >
            Dodaj novi proizvod
          </button>

          <div className="controls-center">
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

      {/* ===== SEKCIJA 2: PRODUCT GRID / EMPTY STATE ===== */}
      <div className="grid-section section-inset">
        {visibleProducts.length === 0 ? (
          <div className="empty-state">
            <h3>{hasAnyProducts ? "Nema rezultata" : "Nema proizvoda za praćenje"}</h3>
            <p>
              {hasAnyProducts
                ? "Pokušaj promijeniti kategoriju ili pretragu."
                : "Dodaj svoj prvi proizvod za praćenje. Ako trebaš pomoć, klikni na gumb pomoć."}
            </p>
            <div className="empty-actions">
            </div>
          </div>
        ) : (
          <div className="product-grid">
            {visibleProducts.map((product) => (
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
        )}

        {/* Floating HELP gumb — prikazuj samo ako nije skriven */}
        {!hideHelp && (
          <button
            className="help-fab"
            onClick={() => setIsHelpOpen(true)}
            aria-label="Upute za korištenje"
            title="Upute"
          >
            <FiHelpCircle size={35} />
          </button>
        )}

        {/* HELP modal */}
        <Modal
          isOpen={isHelpOpen}
          onRequestClose={() => setIsHelpOpen(false)}
          contentLabel="Kako koristiti aplikaciju"
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          <div className="modal-body">
            <div className="notif-panel-header">
              <h4>Kako koristiti PriceHawk</h4>
              <button className="notif-close" onClick={() => setIsHelpOpen(false)}>✕</button>
            </div>

            <ul className="help-list">
              <li><strong>Dodaj proizvod</strong> – klikni gumb “Dodaj novi proizvod”, unesi naziv, URL-ove i Željenu cijenu.</li>
              <li><strong>Kategorije</strong> – filtriraj proizvode po kategoriji.</li>
              <li><strong>Pretraga</strong> – traži po nazivu u gornjoj tražilici.</li>
              <li><strong>Obavijesti</strong> – kad Trenutna cijena padne ispod željene, pojavi se obavijest.</li>
              <li><strong>Kartice proizvoda</strong> – olovka za uređivanje, koš za brisanje.</li>
            </ul>

            <div className="help-footer">
              <label className="hide-help-checkbox">
                <input
                  type="checkbox"
                  checked={hideHelp}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setHideHelp(v);
                    localStorage.setItem("hideHelp", v ? "1" : "0");
                  }}
                />
                Ne prikazuj više ovaj gumb
              </label>

              <button className="save-btn" onClick={() => setIsHelpOpen(false)}>
                Zatvori
              </button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Modal obavijesti */}
      <Modal
        isOpen={isNotificationsOpen}
        onRequestClose={() => setIsNotificationsOpen(false)}
        contentLabel="Obavijesti"
        className="modal-content notif-modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-body">
          <div className="notif-panel-header">
            <h4>Obavijesti</h4>
            <button className="notif-close" onClick={() => setIsNotificationsOpen(false)}>✕</button>
          </div>

          {/* UREZANI KONTEJNER za listu obavijesti */}
          <div className="notif-list-inset">
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
        </div>
      </Modal>

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
