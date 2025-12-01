import { getDb } from "../config/db.js";

export const UserModel = {
  async findByEmail(email) {
    const db = getDb();
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  },

  async findById(id) {
    const db = getDb();
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  },

  async create({ name, email, passwordHash, role }) {
    const db = getDb();
    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, passwordHash, role]
    );
    return { id: result.insertId, name, email, role };
  },
};
