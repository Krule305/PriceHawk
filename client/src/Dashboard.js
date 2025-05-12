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
import "./Dashboard.css"; // make sure CSS is imported

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Sve");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUsername(docSnap.data().username);
        }

        const productsRef = collection(db, "users", user.uid, "products");
        const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
          const productsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setProducts(productsList);
          setLoading(false);
        });

        return () => unsubscribeProducts();
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

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
        await addDoc(userProductsRef, {
          ...product,
          createdAt: new Date(),
        });
        toast.success("Proizvod je uspješno dodan!");
      }

      setEditingProduct(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Greška pri spremanju proizvoda:", error);
      toast.error("Nešto je pošlo po zlu. Pokušaj ponovno.");
    }
  };

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

  if (loading) return <p>Učitavanje...</p>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-welcome">Dobrodošao/la, {username}!</h2>
        <button onClick={handleLogout} className="dashboard-logout">Odjava</button>
      </div>

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
          <input
            type="text"
            placeholder="Pretraži po nazivu..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

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

      <div className="product-grid">
        {products
          .filter((p) =>
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

      <AddProduct
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        initialData={editingProduct}
      />

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
