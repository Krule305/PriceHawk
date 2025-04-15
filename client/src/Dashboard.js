// Dashboard.js
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import AddProduct from "./AddProduct";
import ProductCard from "./ProductCard";
import { toast } from "react-toastify";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUsername(docSnap.data().username);
          }
        } catch (error) {
          console.error("Greška pri dohvaćanju korisnika:", error);
        }
      }
    };

    const fetchProducts = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const productsRef = collection(db, "users", user.uid, "products");
          const querySnapshot = await getDocs(productsRef);
          const productsList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setProducts(productsList);
        } catch (error) {
          console.error("Greška pri dohvaćanju proizvoda:", error);
        }
      }
      setLoading(false);
    };

    fetchUserData();
    fetchProducts();
  }, []);

  const refreshProducts = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const productsRef = collection(db, "users", user.uid, "products");
    const querySnapshot = await getDocs(productsRef);
    const productsList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setProducts(productsList);
  };

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
        await addDoc(userProductsRef, product);
        toast.success("Proizvod je uspješno dodan!");
      }

      await refreshProducts();
    } catch (error) {
      console.error("Greška pri spremanju proizvoda:", error);
      toast.error("Nešto je pošlo po zlu. Pokušaj ponovno.");
    }

    setEditingProduct(null);
    setIsModalOpen(false);
  };

  if (loading) return <p>Učitavanje...</p>;

  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      <div style={styles.header}>
        <h2 style={styles.welcome}>Dobrodošao/la, {username}!</h2>
        <button onClick={handleLogout} style={styles.logout}>Odjava</button>
      </div>

      <div style={{ marginTop: "6rem" }}>
        {products.length === 0 ? (
          <>
            <p style={{ fontSize: "1.2rem", color: "#777" }}>
              Nemate niti jedan proizvod za praćenje.
            </p>
            <button onClick={() => setIsModalOpen(true)}>➕ Dodaj proizvod</button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{ marginBottom: "2rem" }}
            >
              ➕ Dodaj novi proizvod
            </button>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "1rem",
              }}
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={(p) => {
                    setEditingProduct(p);
                    setIsModalOpen(true);
                  }}
                />
              ))}
            </div>
          </>
        )}
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
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 2rem",
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
  },
  welcome: {
    margin: 0,
  },
  logout: {
    padding: "0.5rem 1rem",
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
