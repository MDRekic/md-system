// frontend/src/components/jobs/JobDetailsModal.jsx

import { useEffect, useState } from "react";
import { jobApi } from "../../api/jobApi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const getFileUrl = (path) =>
  path?.startsWith("http") ? path : `${API_URL}${path || ""}`;

const JobDetailsModal = ({ job, onClose, onJobUpdated }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const [completionNotes, setCompletionNotes] = useState("");
  const [completedSuccess, setCompletedSuccess] = useState(true);
  const [files, setFiles] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadAttachments = async () => {
      if (!job?.id) return;
      setLoadingAttachments(true);
      try {
        const res = await jobApi.getAttachments(job.id);
        setAttachments(res.data.data || res.data || []);
      } catch (err) {
        console.error("Greška pri učitavanju dokumenata:", err);
      } finally {
        setLoadingAttachments(false);
      }
    };

    loadAttachments();
  }, [job]);

  // prvo provjera – ako nema job, ništa ne renderujemo
  if (!job) return null;

  // tek sada smijemo pristupiti job.status
  const canComplete =
    job.status === "ASSIGNED" || job.status === "REJECTED";

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canComplete) return;

    setSubmitting(true);
    setMessage("");

    try {
      const fd = new FormData();
      fd.append("completion_notes", completionNotes || "");
      fd.append("completed_success", completedSuccess ? "true" : "false");
      files.forEach((f) => fd.append("files", f));

      await jobApi.completeJob(job.id, fd);

      setMessage("Nalog je poslan na pregled.");
      if (typeof onJobUpdated === "function") {
        await onJobUpdated(); // npr. refresh kalendara
      }
      onClose();
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message ||
          "Došlo je do greške pri slanju naloga na pregled."
      );
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
          padding: 20,
          borderRadius: 8,
          maxWidth: 900,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>
          Nalog #{job.id} ({job.order_number || "bez SK broja"})
        </h2>

        <p>
          <strong>Kupac:</strong> {job.customer_name}
          <br />
          <strong>Adresa:</strong> {job.customer_address},{" "}
          {job.customer_city}
          <br />
          <strong>Telefon:</strong> {job.customer_phone || "—"}
        </p>

        <p>
          <strong>Termin:</strong>{" "}
          {new Date(job.scheduled_from).toLocaleString()} –{" "}
          {new Date(job.scheduled_to).toLocaleString()}
          <br />
          <strong>Tip naloga:</strong> {job.job_type || "—"}
          <br />
          <strong>Status:</strong> {job.status}
        </p>

        {job.creation_comment && (
          <p>
            <strong>Komentar pri terminiranju (admin):</strong>
            <br />
            {job.creation_comment}
          </p>
        )}

        {job.completion_notes && (
          <p>
            <strong>Posljednji komentar tehničara:</strong>
            <br />
            {job.completion_notes}
          </p>
        )}

        <hr />

        <h3>Dokumenti naloga</h3>
        {loadingAttachments && <p>Učitavanje dokumenata...</p>}
        {!loadingAttachments && attachments.length === 0 && (
          <p>Nema dokumenata.</p>
        )}
        {!loadingAttachments && attachments.length > 0 && (
          <ul>
            {attachments.map((att) => (
              <li key={att.id}>
                <a
                  href={getFileUrl(att.file_path)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {att.file_path.split("/").pop()}
                </a>{" "}
                ({att.type})
              </li>
            ))}
          </ul>
        )}

        <hr style={{ margin: "15px 0" }} />

        {canComplete ? (
          <form onSubmit={handleSubmit}>
            <h3>Pošalji nalog na pregled</h3>

            <div style={{ marginBottom: 10 }}>
              <label>
                <input
                  type="radio"
                  name="completed_success"
                  value="success"
                  checked={completedSuccess === true}
                  onChange={() => setCompletedSuccess(true)}
                />{" "}
                Uspješno završeno
              </label>{" "}
              &nbsp;&nbsp;
              <label>
                <input
                  type="radio"
                  name="completed_success"
                  value="fail"
                  checked={completedSuccess === false}
                  onChange={() => setCompletedSuccess(false)}
                />{" "}
                Nije završeno / problem
              </label>
            </div>

            <label>
              Komentar:
              <br />
              <textarea
                rows={3}
                style={{ width: "100%" }}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
              />
            </label>

            <div style={{ marginTop: 10 }}>
              <label>
                Dokumenti (slike / PDF):
                <br />
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />
              </label>
              {files.length > 0 && (
                <ul>
                  {files.map((f, idx) => (
                    <li key={idx}>{f.name}</li>
                  ))}
                </ul>
              )}
            </div>

            {message && (
              <p style={{ color: "red", marginTop: 10 }}>{message}</p>
            )}

            <div
              style={{
                marginTop: 15,
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button type="button" onClick={onClose}>
                Zatvori
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? "Slanje..." : "Pošalji na pregled"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <p style={{ marginTop: 10, fontStyle: "italic" }}>
              Nalog je već poslan na pregled ili je odobren, slanje na
              pregled više nije moguće.
            </p>
            <div
              style={{
                marginTop: 15,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button type="button" onClick={onClose}>
                Zatvori
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JobDetailsModal;
