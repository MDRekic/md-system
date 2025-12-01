// frontend/src/pages/CreateCompanyPage.jsx

import { useState } from "react";
import { companyApi } from "../api/companyApi";

const CreateCompanyPage = () => {
  const [form, setForm] = useState({
    name: "",
    address: "",
    plz: "",
    city: "",
    contact_name: "",
    contact_phone: "",
    tax_id: "",
  });
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append("files", f));

      await companyApi.create(fd);
      setMessage("✅ Firma uspješno kreirana.");

      setForm({
        name: "",
        address: "",
        plz: "",
        city: "",
        contact_name: "",
        contact_phone: "",
        tax_id: "",
      });
      setFiles([]);
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || "❌ Greška pri kreiranju firme."
      );
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Nova firma (podizvođač)</h1>

      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: 500, display: "flex", flexDirection: "column", gap: 8 }}
      >
        <input
          name="name"
          placeholder="Naziv firme"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="address"
          placeholder="Adresa"
          value={form.address}
          onChange={handleChange}
        />
        <input
          name="plz"
          placeholder="Poštanski broj"
          value={form.plz}
          onChange={handleChange}
        />
        <input
          name="city"
          placeholder="Grad"
          value={form.city}
          onChange={handleChange}
        />
        <input
          name="contact_name"
          placeholder="Kontakt osoba"
          value={form.contact_name}
          onChange={handleChange}
        />
        <input
          name="contact_phone"
          placeholder="Telefon kontakt osobe"
          value={form.contact_phone}
          onChange={handleChange}
        />
        <input
          name="tax_id"
          placeholder="ID broj (npr. Steuernummer)"
          value={form.tax_id}
          onChange={handleChange}
        />

        <label>Dokumenti firme (PDF, slike):</label>
        <input
          type="file"
          multiple
          accept="application/pdf,image/*"
          onChange={handleFileChange}
        />
        {files.length > 0 && (
          <ul>
            {files.map((f, idx) => (
              <li key={idx}>{f.name}</li>
            ))}
          </ul>
        )}

        <button type="submit">Snimi firmu</button>
      </form>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
};

export default CreateCompanyPage;
