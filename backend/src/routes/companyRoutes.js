// backend/src/routes/companyRoutes.js

import express from "express";
import { auth } from "../middleware/auth.js";
import { getDb } from "../config/db.js";
import { upload } from "../middleware/upload.js";
import { ok, fail } from "../utils/response.js";

const router = express.Router();

/**
 * GET /api/companies
 * Lista svih firmi (samo admin/semi-admin)
 */
router.get("/", auth(["ADMIN", "SEMI_ADMIN"]), async (req, res, next) => {
  try {
    const db = getDb();
    const [rows] = await db.query(
      "SELECT * FROM companies ORDER BY name ASC"
    );
    ok(res, rows);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/companies
 * Kreiranje nove firme + upload PDF/slika
 */
router.post(
  "/",
  auth(["ADMIN", "SEMI_ADMIN"]),
  upload.array("files", 10),
  async (req, res, next) => {
    try {
      const db = getDb();
      const {
        name,
        address,
        plz,
        city,
        contact_name,
        contact_phone,
        tax_id,
      } = req.body;

      if (!name) {
        return fail(res, 400, "Naziv firme je obavezan");
      }

      const [result] = await db.query(
        `
        INSERT INTO companies
        (name, address, plz, city, contact_name, contact_phone, tax_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          name,
          address || null,
          plz || null,
          city || null,
          contact_name || null,
          contact_phone || null,
          tax_id || null,
        ]
      );

      const companyId = result.insertId;

      const files = req.files || [];
      for (const file of files) {
        await db.query(
          `
          INSERT INTO company_documents (company_id, file_path)
          VALUES (?, ?)
        `,
          [companyId, "/uploads/" + file.filename]
        );
      }

      ok(res, { id: companyId }, "Firma kreirana");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
