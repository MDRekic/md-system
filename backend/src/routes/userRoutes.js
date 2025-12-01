// backend/src/routes/userRoutes.js

import express from "express";
import bcrypt from "bcryptjs";
import { auth } from "../middleware/auth.js";
import { getDb } from "../config/db.js";
import { ok, fail } from "../utils/response.js";

const router = express.Router();

/**
 * GET /api/users
 * Lista tehničara (USER/SEMI_ADMIN) sa firmom i ulogom
 */
router.get("/", auth(["ADMIN", "SEMI_ADMIN"]), async (req, res, next) => {
  try {
    const db = getDb();

    const [rows] = await db.query(
      `
      SELECT id, name, email, phone, company_id, job_role, role
      FROM users
      WHERE role = 'USER' OR role = 'SEMI_ADMIN'
      ORDER BY name ASC
    `
    );

    ok(res, rows);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users/technicians
 * Kreira novog tehničara za određenu firmu
 */
router.post(
  "/technicians",
  auth(["ADMIN", "SEMI_ADMIN"]),
  async (req, res, next) => {
    try {
      const db = getDb();

      const {
        name,
        email,
        phone,
        password,
        company_id,
        job_role, // 'TIEFBAU' ili 'EINBLAESER'
      } = req.body;

      if (!name || !email || !password || !company_id || !job_role) {
        return fail(res, 400, "Nedostaju obavezna polja");
      }

      // provjera da email ne postoji
      const [existing] = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );
      if (existing.length > 0) {
        return fail(res, 400, "Korisnik sa ovim emailom već postoji");
      }

      const hash = await bcrypt.hash(password, 10);

      await db.query(
        `
        INSERT INTO users
        (name, email, phone, password_hash, role, company_id, job_role)
        VALUES (?, ?, ?, ?, 'USER', ?, ?)
      `,
        [name, email, phone || null, hash, company_id, job_role]
      );

      ok(res, null, "Tehničar kreiran");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
