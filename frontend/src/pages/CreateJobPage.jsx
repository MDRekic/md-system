// frontend/src/pages/CreateJobPage.jsx

import { useEffect, useState } from "react";
import { jobApi } from "../api/jobApi";
import { companyApi } from "../api/companyApi";
import { userApi } from "../api/userApi";

const CreateJobPage = () => {
  const [companies, setCompanies] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [form, setForm] = useState({
    customer_name: "",
    customer_address: "",
    customer_city: "",
    customer_phone: "",
    order_number: "",
    job_type: "NE3",
    scheduled_from: "",
    scheduled_to: "",
    company_id: "",
    assigned_user_id: "",
    creation_comment: "",
  });

  const [jobRoleFilter, setJobRoleFilter] = useState("TIEFBAU");
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, tRes] = await Promise.all([
          companyApi.getAll(),
          userApi.getTechnicians(),
        ]);
        setCompanies(cRes.data.data || cRes.data || []);
        setTechnicians(tRes.data.data || tRes.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ako promijeniš firmu, resetuj tehničara
    if (name === "company_id") {
      setForm((prev) => ({
        ...prev,
        company_id: value,
        assigned_user_id: "",
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
  };

  const filteredTechnicians = technicians.filter((t) => {
  if (!form.company_id) return false;
  if (String(t.company_id) !== String(form.company_id)) return false;

  // dozvoli i one koji imaju oba posla
  if (
    jobRoleFilter &&
    ![jobRoleFilter, "TIEFBAU_EINBLAESER"].includes(t.job_role)
  ) {
    return false;
  }

  return true;
});


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append("files", f));

      await jobApi.createJob(fd);
      setMessage("✅ Nalog uspješno kreiran.");

      setForm({
        customer_name: "",
        customer_address: "",
        customer_city: "",
        customer_phone: "",
        order_number: "",
        job_type: "NE3",
        scheduled_from: "",
        scheduled_to: "",
        company_id: "",
        assigned_user_id: "",
        creation_comment: "",
      });
      setFiles([]);
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || "❌ Greška prilikom snimanja naloga."
      );
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Novi nalog</h1>

      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 8 }}
      >
        <input
          name="customer_name"
          placeholder="Ime i prezime kupca"
          value={form.customer_name}
          onChange={handleChange}
          required
        />
        <input
          name="customer_address"
          placeholder="Adresa"
          value={form.customer_address}
          onChange={handleChange}
          required
        />
        <input
          name="customer_city"
          placeholder="Grad"
          value={form.customer_city}
          onChange={handleChange}
          required
        />
        <input
          name="customer_phone"
          placeholder="Telefon"
          value={form.customer_phone}
          onChange={handleChange}
        />
        <input
          name="order_number"
          placeholder="SK broj"
          value={form.order_number}
          onChange={handleChange}
        />

        <select name="job_type" value={form.job_type} onChange={handleChange}>
          <option value="NE3">NE3</option>
          <option value="NE4">NE4</option>
          <option value="TK">TK</option>
          <option value="MESS">MESS</option>
        </select>

        <label>Od:</label>
        <input
          type="datetime-local"
          name="scheduled_from"
          value={form.scheduled_from}
          onChange={handleChange}
          required
        />

        <label>Do:</label>
        <input
          type="datetime-local"
          name="scheduled_to"
          value={form.scheduled_to}
          onChange={handleChange}
          required
        />

        <label>Firma (podizvođač):</label>
        <select
          name="company_id"
          value={form.company_id}
          onChange={handleChange}
          required
        >
          <option value="">-- Izaberi firmu --</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label>Tip tehničara:</label>
        <select
          value={jobRoleFilter}
          onChange={(e) => setJobRoleFilter(e.target.value)}
        >
          <option value="TIEFBAU">Tiefbau</option>
          <option value="EINBLAESER">Einbläser</option>
        </select>

        <label>Tehničar:</label>
        <select
          name="assigned_user_id"
          value={form.assigned_user_id}
          onChange={handleChange}
          required
        >
          <option value="">-- Izaberi tehničara --</option>
          {filteredTechnicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.job_role})
            </option>
          ))}
        </select>

        <label>Komentar pri terminiranju:</label>
        <textarea
          name="creation_comment"
          rows={3}
          value={form.creation_comment}
          onChange={handleChange}
        />

        <label>Dokumenti / slike (pri kreiranju naloga):</label>
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleFileChange}
        />
        {files.length > 0 && (
          <ul>
            {files.map((f, idx) => (
              <li key={idx}>{f.name}</li>
            ))}
          </ul>
        )}

        <button type="submit">Snimi nalog</button>
      </form>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
};

export default CreateJobPage;
