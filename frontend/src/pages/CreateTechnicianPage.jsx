// frontend/src/pages/CreateTechnicianPage.jsx

import { useEffect, useState } from "react";
import { companyApi } from "../api/companyApi";
import { userApi } from "../api/userApi";

const CreateTechnicianPage = () => {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    company_id: "",
    job_role: "TIEFBAU",
    role: "USER",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await companyApi.getAll();
        setCompanies(res.data.data || res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await userApi.createTechnician(form);
      setMessage("✅ Tehničar kreiran.");

      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        company_id: "",
        job_role: "TIEFBAU",
        role: "USER",
      });
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || "❌ Greška pri kreiranju tehničara."
      );
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Novi tehničar</h1>

      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: 500, display: "flex", flexDirection: "column", gap: 8 }}
      >
        <input
          name="name"
          placeholder="Ime i prezime"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="E-mail (login)"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="phone"
          placeholder="Telefon"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          name="password"
          type="password"
          placeholder="Lozinka za login"
          value={form.password}
          onChange={handleChange}
          required
        />

        <label>Firma:</label>
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

        <label>Tip tehničara1:</label>
       <select
  name="job_role"
  value={form.job_role}
  onChange={handleChange}
  required
>
  <option value="TIEFBAU">Tiefbau</option>
  <option value="EINBLAESER">Einbläser</option>
  <option value="TIEFBAU_EINBLAESER">Tiefbau + Einbläser</option>
</select>

  <label>Uloga:</label>
  <select name="role" value={form.role} onChange={handleChange} required>
    <option value="USER">User</option>
    <option value="ADMIN">Admin</option>
  </select>

  <button type="submit">Snimi tehničara</button>
      </form>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
};

export default CreateTechnicianPage;
