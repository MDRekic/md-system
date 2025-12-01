// frontend/src/pages/AdminReviewPage.jsx

import { useEffect, useState } from "react";
import { jobApi } from "../api/jobApi";
import { companyApi } from "../api/companyApi";
import { userApi } from "../api/userApi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const getFileUrl = (path) =>
  path.startsWith("http") ? path : `${API_URL}${path}`;

const AdminReviewPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // trenutno izabrani nalog
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  // Odluka (odobri/odbij)
  const [decision, setDecision] = useState("APPROVE"); // "APPROVE" ili "REJECT"

  // ODOBRAVANJE
  const [approveReason, setApproveReason] = useState("");
  const [forwardEnabled, setForwardEnabled] = useState(true);
  const [forwardCompanyId, setForwardCompanyId] = useState("");
  const [forwardUserId, setForwardUserId] = useState("");
  const [forwardFrom, setForwardFrom] = useState("");
  const [forwardTo, setForwardTo] = useState("");
  const [forwardComment, setForwardComment] = useState("");
  const [forwardFiles, setForwardFiles] = useState([]);

  // ODBIJANJE
  const [rejectReason, setRejectReason] = useState("");

  // zajedničko
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [jobsRes, companiesRes, techRes] = await Promise.all([
        jobApi.getPendingJobs(),
        companyApi.getAll(),
        userApi.getTechnicians(),
      ]);

      setJobs(jobsRes.data.data || jobsRes.data || []);
      setCompanies(companiesRes.data.data || companiesRes.data || []);
      setTechnicians(techRes.data.data || techRes.data || []);
    } catch (err) {
      console.error("Greška pri učitavanju:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // kada klikneš "Pregledaj"
  const openJobModal = async (job) => {
    setSelectedJob(job);
    setDecision("APPROVE");
    setApproveReason("");
    setRejectReason("");
    setForwardEnabled(true);
    setForwardCompanyId("");
    setForwardUserId("");
    setForwardFrom("");
    setForwardTo("");
    setForwardComment("");
    setForwardFiles([]);
    setMessage("");
    setAttachments([]);
    setModalOpen(true);

    // učitaj dokumente za taj nalog
    setAttachmentsLoading(true);
    try {
      const res = await jobApi.getAttachments(job.id);
      setAttachments(res.data.data || res.data || []);
    } catch (err) {
      console.error("Greška pri učitavanju dokumenata:", err);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  // tehnicari koji mogu biti EINBLAESER (čisti Einbläser ili Tiefbau+Einblasen)
  const forwardTechnicians = technicians.filter((t) => {
    if (!forwardCompanyId) return false;
    if (String(t.company_id) !== String(forwardCompanyId)) return false;
    if (!["EINBLAESER", "TIEFBAU_EINBLAESER"].includes(t.job_role))
      return false;
    return true;
  });

  const handleForwardFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setForwardFiles((prev) => [...prev, ...selected]);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedJob(null);
    setAttachments([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    setSaving(true);
    setMessage("");

    try {
      if (decision === "REJECT") {
        // ODBIJANJE
        if (!rejectReason.trim()) {
          setMessage("Molimo upiši razlog odbijanja.");
          setSaving(false);
          return;
        }
        await jobApi.rejectJob(selectedJob.id, rejectReason);
      } else {
        // ODOBRAVANJE

        // role koje tretiramo kao Tiefbau za prosljeđivanje:
        // TIEFBAU, TIEFBAU_EINBLAESER i prazan (stari korisnik koji radi sve)
        const role = selectedJob.technician_job_role;
        const isTiefbauLike =
          role === "TIEFBAU" || role === "TIEFBAU_EINBLAESER" || !role;

        if (!isTiefbauLike) {
          // jednostavno odobravanje bez Einblasen-a
          await jobApi.approveJob(selectedJob.id, approveReason || "");
        } else {
          // Tiefbau / radi sve → approve + opcionalno prosljeđivanje na Einblasen
          const fd = new FormData();
          fd.append("reason", approveReason || "");

          if (forwardEnabled) {
            if (!forwardCompanyId || !forwardUserId) {
              setMessage(
                "Molimo izaberi firmu i tehničara za Einblasen ili isključi opciju proslijeđivanja."
              );
              setSaving(false);
              return;
            }

            fd.append("forward_company_id", forwardCompanyId);
            fd.append("forward_user_id", forwardUserId);
            if (forwardFrom) fd.append("forward_from", forwardFrom);
            if (forwardTo) fd.append("forward_to", forwardTo);
            if (forwardComment)
              fd.append("forward_comment", forwardComment);
            forwardFiles.forEach((f) => fd.append("files", f));
          }

          await jobApi.approveAndForward(selectedJob.id, fd);
        }
      }

      closeModal();
      await loadAll();
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message ||
          "Došlo je do greške pri spremanju odluke."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Nalozi na čekanju</h1>

      {loading && <p>Učitavanje...</p>}

      {!loading && jobs.length === 0 && <p>Nema naloga na čekanju.</p>}

      {!loading && jobs.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 10,
          }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc" }}>ID</th>
              <th style={{ borderBottom: "1px solid #ccc" }}>SK broj</th>
              <th style={{ borderBottom: "1px solid #ccc" }}>Kupac</th>
              <th style={{ borderBottom: "1px solid #ccc" }}>Grad</th>
              <th style={{ borderBottom: "1px solid #ccc" }}>Tehničar</th>
              <th style={{ borderBottom: "1px solid #ccc" }}>Uloga</th>
              <th style={{ borderBottom: "1px solid #ccc" }}>Termin</th>
              <th style={{ borderBottom: "1px solid #ccc" }}>Akcija</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td style={{ borderBottom: "1px solid #eee" }}>{job.id}</td>
                <td style={{ borderBottom: "1px solid " +
                    "#eee" }}
                >
                  {job.order_number}
                </td>
                <td style={{ borderBottom: "1px solid #eee" }}>
                  {job.customer_name}
                </td>
                <td style={{ borderBottom: "1px solid #eee" }}>
                  {job.customer_city}
                </td>
                <td style={{ borderBottom: "1px solid #eee" }}>
                  {job.technician_name || "—"}
                </td>
                <td style={{ borderBottom: "1px solid #eee" }}>
                  {job.technician_job_role || "—"}
                </td>
                <td style={{ borderBottom: "1px solid #eee" }}>
                  {new Date(job.scheduled_from).toLocaleString()} –{" "}
                  {new Date(job.scheduled_to).toLocaleString()}
                </td>
                <td style={{ borderBottom: "1px solid #eee" }}>
                  <button onClick={() => openJobModal(job)}>Pregledaj</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAL ZA PREGLED + ODLUKU */}
      {modalOpen && selectedJob && (
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
          onClick={closeModal}
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
              Nalog #{selectedJob.id} ({selectedJob.order_number || "bez SK"})
            </h2>

            <p>
              <strong>Kupac:</strong> {selectedJob.customer_name}
              <br />
              <strong>Adresa:</strong> {selectedJob.customer_address},{" "}
              {selectedJob.customer_city}
              <br />
              <strong>Telefon:</strong>{" "}
              {selectedJob.customer_phone || "—"}
            </p>

            <p>
              <strong>Termin:</strong>{" "}
              {new Date(
                selectedJob.scheduled_from
              ).toLocaleString()}{" "}
              –{" "}
              {new Date(selectedJob.scheduled_to).toLocaleString()}
              <br />
              <strong>Tip naloga:</strong>{" "}
              {selectedJob.job_type || "—"}
              <br />
              <strong>Tehničar:</strong>{" "}
              {selectedJob.technician_name || "—"} (
              {selectedJob.technician_job_role || "—"})
            </p>

            {selectedJob.creation_comment && (
              <p>
                <strong>Komentar pri terminiranju (admin):</strong>
                <br />
                {selectedJob.creation_comment}
              </p>
            )}

            {selectedJob.completion_notes && (
              <p>
                <strong>Komentar tehničara pri odjavi:</strong>
                <br />
                {selectedJob.completion_notes}
              </p>
            )}

            <hr />

            <h3>Dokumenti od Tiefbau tehničara</h3>
            {attachmentsLoading && <p>Učitavanje dokumenata...</p>}
            {!attachmentsLoading && attachments.length === 0 && (
              <p>Nema dokumenata.</p>
            )}
            {!attachmentsLoading && attachments.length > 0 && (
              <ul>
                {attachments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={getFileUrl(a.file_path)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {a.file_path.split("/").pop()}
                    </a>{" "}
                    ({a.type})
                  </li>
                ))}
              </ul>
            )}

            <hr style={{ margin: "15px 0" }} />

            {/* Forma za odluku */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 10 }}>
                <label>
                  <input
                    type="radio"
                    name="decision"
                    value="APPROVE"
                    checked={decision === "APPROVE"}
                    onChange={() => setDecision("APPROVE")}
                  />{" "}
                  Odobri nalog
                </label>{" "}
                &nbsp;&nbsp;
                <label>
                  <input
                    type="radio"
                    name="decision"
                    value="REJECT"
                    checked={decision === "REJECT"}
                    onChange={() => setDecision("REJECT")}
                  />{" "}
                  Odbij nalog
                </label>
              </div>

              {decision === "REJECT" && (
                <div style={{ marginTop: 10 }}>
                  <label>
                    Razlog odbijanja:
                    <br />
                    <textarea
                      rows={3}
                      style={{ width: "100%" }}
                      value={rejectReason}
                      onChange={(e) =>
                        setRejectReason(e.target.value)
                      }
                    />
                  </label>
                </div>
              )}

              {decision === "APPROVE" && (
                <div style={{ marginTop: 10 }}>
                  <label>
                    Komentar / razlog odobravanja:
                    <br />
                    <textarea
                      rows={3}
                      style={{ width: "100%" }}
                      value={approveReason}
                      onChange={(e) =>
                        setApproveReason(e.target.value)
                      }
                    />
                  </label>

                  {/* Einblasen blok: za Tiefbau, Tiefbau+Einblasen ili prazan job_role */}
                  {(() => {
                    const role = selectedJob.technician_job_role;
                    const isTiefbauLike =
                      role === "TIEFBAU" ||
                      role === "TIEFBAU_EINBLAESER" ||
                      !role;
                    return (
                      isTiefbauLike && (
                        <>
                          <hr style={{ margin: "15px 0" }} />
                          <label>
                            <input
                              type="checkbox"
                              checked={forwardEnabled}
                              onChange={(e) =>
                                setForwardEnabled(e.target.checked)
                              }
                            />{" "}
                            Pošalji nalog za Einblasen
                          </label>

                          {forwardEnabled && (
                            <div style={{ marginTop: 10 }}>
                              <label>
                                Firma (Einblasen):
                                <br />
                                <select
                                  value={forwardCompanyId}
                                  onChange={(e) => {
                                    setForwardCompanyId(e.target.value);
                                    setForwardUserId("");
                                  }}
                                  style={{ width: "100%" }}
                                >
                                  <option value="">
                                    -- izaberi firmu --
                                  </option>
                                  {companies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label>
                                Tehničar (Einbläser):
                                <br />
                                <select
                                  value={forwardUserId}
                                  onChange={(e) =>
                                    setForwardUserId(e.target.value)
                                  }
                                  style={{ width: "100%" }}
                                >
                                  <option value="">
                                    -- izaberi tehničara --
                                  </option>
                                  {forwardTechnicians.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name} ({t.email})
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  marginTop: 8,
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <label>
                                    Termin od:
                                    <br />
                                    <input
                                      type="datetime-local"
                                      style={{ width: "100%" }}
                                      value={forwardFrom}
                                      onChange={(e) =>
                                        setForwardFrom(e.target.value)
                                      }
                                    />
                                  </label>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label>
                                    Termin do:
                                    <br />
                                    <input
                                      type="datetime-local"
                                      style={{ width: "100%" }}
                                      value={forwardTo}
                                      onChange={(e) =>
                                        setForwardTo(e.target.value)
                                      }
                                    />
                                  </label>
                                </div>
                              </div>

                              <label>
                                Komentar za Einblasen nalog:
                                <br />
                                <textarea
                                  rows={3}
                                  style={{ width: "100%" }}
                                  value={forwardComment}
                                  onChange={(e) =>
                                    setForwardComment(e.target.value)
                                  }
                                />
                              </label>

                              <label>
                                Dokumenti za Einbläser:
                                <br />
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*,application/pdf"
                                  onChange={handleForwardFileChange}
                                />
                              </label>
                              {forwardFiles.length > 0 && (
                                <ul>
                                  {forwardFiles.map((f, idx) => (
                                    <li key={idx}>{f.name}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </>
                      )
                    );
                  })()}
                </div>
              )}

              {message && (
                <p style={{ marginTop: 10, color: "red" }}>{message}</p>
              )}

              <div
                style={{
                  marginTop: 15,
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <button type="button" onClick={closeModal}>
                  Zatvori
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? "Spremanje..." : "Snimi odluku"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewPage;
