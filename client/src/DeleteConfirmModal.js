import React from "react";
import Modal from "react-modal";
import "./DeleteConfirmModal.css";

Modal.setAppElement("#root");

export default function DeleteConfirmModal({ isOpen, onCancel, onConfirm }) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onCancel}
      className="confirm-modal-content"
      overlayClassName="confirm-modal-overlay"
      contentLabel="Potvrdi brisanje"
    >
      {/* Naslov i opis upozorenja */}
      <h2>Obrisati proizvod?</h2>
      <p>Jesi li siguran/na da želiš obrisati ovaj proizvod? Ova radnja se ne može poništiti.</p>

      {/* Gumbi za odustajanje ili potvrdu */}
      <div className="confirm-modal-actions">
        <button className="cancel-btn" onClick={onCancel}>Odustani</button>
        <button className="delete-btn" onClick={onConfirm}>Obriši</button>
      </div>
    </Modal>
  );
}
