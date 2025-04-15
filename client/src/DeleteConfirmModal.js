// DeleteConfirmModal.js
export default function DeleteConfirmModal({ isOpen, onCancel, onConfirm }) {
    if (!isOpen) return null;
  
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <h3>Potvrda brisanja</h3>
          <p>Jeste li sigurni da želite obrisati ovaj proizvod?</p>
          <div style={styles.actions}>
            <button onClick={onCancel} style={styles.cancel}>Odustani</button>
            <button onClick={onConfirm} style={styles.confirm}>Obriši</button>
          </div>
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
      backgroundColor: "#fff",
      padding: "2rem",
      borderRadius: "10px",
      width: "90%",
      maxWidth: "400px",
      textAlign: "center",
    },
    actions: {
      marginTop: "1.5rem",
      display: "flex",
      justifyContent: "space-between",
    },
    cancel: {
      padding: "0.5rem 1rem",
      backgroundColor: "#999",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    confirm: {
      padding: "0.5rem 1rem",
      backgroundColor: "#e53935",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
  };
  