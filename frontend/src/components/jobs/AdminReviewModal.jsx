// frontend/src/components/jobs/AdminReviewModal.jsx

import { useEffect, useState } from "react";
import { jobApi } from "../../api/jobApi";

const AdminReviewModal = ({ job, onClose, onResolved }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!job) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await jobApi.getAttachments(job.id);
        setAttachments(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [job]);

  if (!job) return null;

  const handleApprove = async () => {
    setSubmitting(true);
    setMessage("");

    try {
      await jobApi.approveJob(job.id, reason);
      setMessage("Nalog je odobren.");
      if (onResolved) onResolved();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Greška pri odobravanju.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      setMessage("Unesi razlog odbijanja.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      await jobApi.rejectJob(job.id, reason);
      setMessage("Nalog je odbijen.");
      if (onResolved) onResolved();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Greška pri odbijanju.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Admin pregled naloga</h2>

        <p>
          <strong>SK broj:</strong> {job.order_number}
        </p>
        <p>
          <strong>Tehničar:</strong> {job.technician_name || job.assigned_user_id}
        </p>
        <p>
          <strong>Kupac:</strong> {job.customer_name}
        </p>
        <p>
          <strong>Adresa:</strong> {job.customer_address}, {job.customer_city}
        </p>
        <p>
          <strong>Telefon:</strong> {job.customer_phone}
        </p>
        <p>
          <strong>Tip naloga:</strong> {job.job_type}
        </p>
        <p>
          <strong>Status:</strong> {job.status}
        </p>
        <p>
          <strong>Termin:</strong>{" "}
          {new Date(job.scheduled_from).toLocaleString()} -{" "}
          {new Date(job.scheduled_to).toLocaleString()}
        </p>
        <p>
          <strong>Opis tehničara:</strong> {job.completion_notes || "—"}
        </p>
        <p>
          <strong>Rezultat:</strong>{" "}
          {job.completed_success === 1
            ? "Uspješno završeno"
            : job.completed_success === 0
            ? "Nije uspjelo"
            : "—"}
        </p>

        <hr />

        <h3>Prilozi</h3>
        {loading && <p>Učitavanje priloga...</p>}
        {!loading && attachments.length === 0 && <p>Nema priloga.</p>}
        {!loading && attachments.length > 0 && (
          <ul>
            {attachments.map((att) => (
              <li key={att.id}>
                [{att.type}]{" "}
                <a
                  href={`http://localhost:4000${att.file_path}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Otvori
                </a>{" "}
                ({new Date(att.created_at).toLocaleString()})
              </li>
            ))}
          </ul>
        )}

        <hr />

        <h3>Odobri / odbij</h3>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Komentar / razlog (vidljiv u historiji, i kod odbijanja obavezan):
            <br />
            <textarea
              rows={3}
              style={{ width: "100%" }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
        </div>

        {message && (
          <p style={{ color: "green", marginBottom: "10px" }}>{message}</p>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={handleApprove}
            disabled={submitting}
            style={{
              background: "#4caf50",
              color: "#fff",
              border: "none",
              padding: "8px 14px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {submitting ? "..." : "Odobri"}
          </button>

          <button
            type="button"
            onClick={handleReject}
            disabled={submitting}
            style={{
              background: "#f44336",
              color: "#fff",
              border: "none",
              padding: "8px 14px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {submitting ? "..." : "Odbij"}
          </button>

          <button type="button" onClick={onClose}>
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminReviewModal;
