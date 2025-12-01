// backend/src/routes/jobRoutes.js

import express from "express";
import { auth } from "../middleware/auth.js";
import { getDb } from "../config/db.js";
import { upload } from "../middleware/upload.js";
import { ok, fail } from "../utils/response.js";

const router = express.Router();

/**
 * GET /api/jobs
 * Kalendar – admin sve, ostali samo svoje naloge
 */
router.get("/", auth(), async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const userId = req.user.id;
    const role = req.user.role;

    const db = getDb();

    let sql = `
      SELECT *
      FROM jobs
      WHERE 1 = 1
    `;
    const params = [];

    if (from && to) {
      sql += " AND scheduled_from >= ? AND scheduled_to <= ?";
      params.push(from, to);
    }

    // Tehničar / firma vidi samo svoje naloge
    if (role !== "ADMIN" && role !== "SEMI_ADMIN") {
      sql += " AND assigned_user_id = ?";
      params.push(userId);
    }

    const [rows] = await db.query(sql, params);

    ok(res, rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/jobs/pending
 * Nalozi na čekanju (admin/semi-admin)
 */
router.get(
  "/pending",
  auth(["ADMIN", "SEMI_ADMIN"]),
  async (req, res, next) => {
    try {
      const db = getDb();
      const [rows] = await db.query(
        `
        SELECT j.*,
               u.name      AS technician_name,
               u.job_role  AS technician_job_role
        FROM jobs j
        LEFT JOIN users u ON j.assigned_user_id = u.id
        WHERE j.status = 'WAITING_REVIEW'
        ORDER BY j.scheduled_from DESC
      `
      );

      ok(res, rows);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/jobs
 * Novi nalog – firma + tehničar + komentar + fajlovi
 */
router.post(
  "/",
  auth(["ADMIN", "SEMI_ADMIN"]),
  upload.array("files", 10),
  async (req, res, next) => {
    try {
      const db = getDb();
      const adminId = req.user.id;

      const {
        customer_name,
        customer_address,
        customer_city,
        customer_phone,
        order_number,
        job_type,
        scheduled_from,
        scheduled_to,
        assigned_user_id,
        company_id,
        creation_comment,
      } = req.body;

      if (
        !customer_name ||
        !customer_address ||
        !customer_city ||
        !scheduled_from ||
        !scheduled_to ||
        !assigned_user_id ||
        !company_id
      ) {
        return fail(res, 400, "Nedostaju obavezna polja");
      }

      const [result] = await db.query(
        `
        INSERT INTO jobs
        (
          customer_name,
          customer_address,
          customer_city,
          customer_phone,
          order_number,
          job_type,
          scheduled_from,
          scheduled_to,
          assigned_user_id,
          company_id,
          created_by,
          creation_comment,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED')
      `,
        [
          customer_name,
          customer_address,
          customer_city,
          customer_phone || null,
          order_number || null,
          job_type || null,
          scheduled_from,
          scheduled_to,
          assigned_user_id,
          company_id,
          adminId,
          creation_comment || null,
        ]
      );

      const jobId = result.insertId;

      // Fajlovi pri kreiranju naloga
      const files = req.files || [];
      for (const file of files) {
        let type = "OTHER";
        if (file.mimetype.startsWith("image/")) type = "PHOTO";
        if (file.mimetype === "application/pdf") type = "DOCUMENT";

        await db.query(
          `
          INSERT INTO job_attachments
          (job_id, type, file_path, uploaded_by)
          VALUES (?, ?, ?, ?)
        `,
          [jobId, type, "/uploads/" + file.filename, adminId]
        );
      }

      ok(res, { id: jobId }, "Nalog uspješno kreiran");
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/jobs/:id/complete
 * Tehničar odjavljuje nalog + fajlovi
 */
router.post(
  "/:id/complete",
  auth(),
  upload.array("files", 10),
  async (req, res, next) => {
    try {
      const db = getDb();
      const jobId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;

      const { completion_notes, completed_success } = req.body;

      const [jobs] = await db.query("SELECT * FROM jobs WHERE id = ?", [
        jobId,
      ]);
      const job = jobs[0];

      if (!job) return fail(res, 404, "Nalog ne postoji");

      if (userRole !== "ADMIN" && job.assigned_user_id !== userId) {
        return fail(res, 403, "Nemaš pravo da odjaviš ovaj nalog");
      }

      await db.query(
        `
        UPDATE jobs
        SET
          completion_notes = ?,
          completed_success = ?,
          completed_at = NOW(),
          status = 'WAITING_REVIEW'
        WHERE id = ?
      `,
        [completion_notes || null, completed_success === "true" ? 1 : 0, jobId]
      );

      const files = req.files || [];
      for (const file of files) {
        let type = "OTHER";
        if (file.mimetype.startsWith("image/")) type = "PHOTO";
        if (file.mimetype === "application/pdf") type = "DOCUMENT";

        await db.query(
          `
          INSERT INTO job_attachments
          (job_id, type, file_path, uploaded_by)
          VALUES (?, ?, ?, ?)
        `,
          [jobId, type, "/uploads/" + file.filename, userId]
        );
      }

      await db.query(
        `
        INSERT INTO job_status_history
        (job_id, old_status, new_status, changed_by, comment)
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          jobId,
          job.status,
          "WAITING_REVIEW",
          userId,
          "Nalog odjavljen od tehničara",
        ]
      );

      ok(res, null, "Nalog odjavljen i poslat na pregled");
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/jobs/:id/attachments
 */
router.get("/:id/attachments", auth(), async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const db = getDb();

    const [rows] = await db.query(
      "SELECT id, type, file_path, created_at FROM job_attachments WHERE job_id = ?",
      [jobId]
    );

    ok(res, rows);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/jobs/:id/approve
 * Klasično odobravanje (bez slanja na Einblasen)
 */
router.post(
  "/:id/approve",
  auth(["ADMIN", "SEMI_ADMIN"]),
  async (req, res, next) => {
    try {
      const jobId = req.params.id;
      const { reason } = req.body || {};
      const adminId = req.user.id;
      const db = getDb();

      const [jobs] = await db.query("SELECT * FROM jobs WHERE id = ?", [
        jobId,
      ]);
      const job = jobs[0];

      if (!job) return fail(res, 404, "Nalog ne postoji");

      const comment = reason || "Odobreno";

      await db.query(
        "UPDATE jobs SET status = 'APPROVED', admin_comment = ? WHERE id = ?",
        [comment, jobId]
      );

      await db.query(
        `
        INSERT INTO job_status_history
        (job_id, old_status, new_status, changed_by, comment)
        VALUES (?, ?, ?, ?, ?)
      `,
        [jobId, job.status, "APPROVED", adminId, comment]
      );

      if (job.assigned_user_id) {
        await db.query(
          `
          INSERT INTO notifications (user_id, title, message)
          VALUES (?, ?, ?)
        `,
          [
            job.assigned_user_id,
            "Nalog odobren",
            `Nalog ${job.order_number || job.id} je odobren.`,
          ]
        );
      }

      ok(res, null, "Nalog odobren");
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/jobs/:id/approve-forward
 * ODOBRI Tiefbau nalog + opcionalno kreiraj novi nalog za Einblasen
 * multipart/form-data (FormData)
 */
router.post(
  "/:id/approve-forward",
  auth(["ADMIN", "SEMI_ADMIN"]),
  upload.array("files", 10),
  async (req, res, next) => {
    try {
      const jobId = req.params.id;
      const adminId = req.user.id;
      const db = getDb();

      const {
        reason,
        forward_company_id,
        forward_user_id,
        forward_from,
        forward_to,
        forward_comment,
      } = req.body;

      // učitaj originalni nalog + ulogu tehničara (TIEFBAU / EINBLAESER)
      const [jobs] = await db.query(
        `
        SELECT j.*,
               u.job_role AS technician_job_role
        FROM jobs j
        LEFT JOIN users u ON j.assigned_user_id = u.id
        WHERE j.id = ?
      `,
        [jobId]
      );
      const job = jobs[0];

      if (!job) return fail(res, 404, "Nalog ne postoji");

      const comment = reason || "Odobreno";

      // 1) Odobri postojeći nalog (Tiefbau)
      await db.query(
        "UPDATE jobs SET status = 'APPROVED', admin_comment = ? WHERE id = ?",
        [comment, jobId]
      );

      await db.query(
        `
        INSERT INTO job_status_history
        (job_id, old_status, new_status, changed_by, comment)
        VALUES (?, ?, ?, ?, ?)
      `,
        [jobId, job.status, "APPROVED", adminId, comment]
      );

      if (job.assigned_user_id) {
        await db.query(
          `
          INSERT INTO notifications (user_id, title, message)
          VALUES (?, ?, ?)
        `,
          [
            job.assigned_user_id,
            "Nalog odobren",
            `Nalog ${job.order_number || job.id} je odobren.`,
          ]
        );
      }

     // 2) Ako je označeno slanje na Einblasen → kreiraj novi nalog
let newJobId = null;

// role koje smatramo "Tiefbau za prosljeđivanje":
// - TIEFBAU
// - TIEFBAU_EINBLAESER (radi sve)
// - null / "" (stari korisnik koji radi sve bez role)
const role = job.technician_job_role;
const isTiefbauLike =
  role === "TIEFBAU" ||
  role === "TIEFBAU_EINBLAESER" ||
  !role;

if (
  forward_company_id &&
  forward_user_id &&
  isTiefbauLike
) {
  const newFrom = forward_from || job.scheduled_from;
  const newTo = forward_to || job.scheduled_to;

  const [resultNew] = await db.query(
    `
      INSERT INTO jobs
      (
        customer_name,
        customer_address,
        customer_city,
        customer_phone,
        order_number,
        job_type,
        scheduled_from,
        scheduled_to,
        assigned_user_id,
        company_id,
        created_by,
        creation_comment,
        status,
        source_job_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', ?)
    `,
    [
      job.customer_name,
      job.customer_address,
      job.customer_city,
      job.customer_phone,
      job.order_number,
      job.job_type,
      newFrom,
      newTo,
      forward_user_id,
      forward_company_id,
      adminId,
      forward_comment || "Nalog za Einblasen kreiran iz Tiefbau naloga",
      job.id,
    ]
  );

  newJobId = resultNew.insertId;

  // ako želiš odmah upisati i dokumente za Einblasen nalog:
  if (req.files && req.files.length > 0) {
    const values = req.files.map((f) => [
      newJobId,
      f.path.replace(/\\/g, "/"),
      "EINBLAESER",
    ]);
    await db.query(
      "INSERT INTO job_attachments (job_id, file_path, type) VALUES ?",
      [values]
    );
  }



        // fajlovi koji su samo za Einbläser nalog
        const files = req.files || [];
        for (const file of files) {
          let type = "OTHER";
          if (file.mimetype.startsWith("image/")) type = "PHOTO";
          if (file.mimetype === "application/pdf") type = "DOCUMENT";

          await db.query(
            `
            INSERT INTO job_attachments
            (job_id, type, file_path, uploaded_by)
            VALUES (?, ?, ?, ?)
          `,
            [newJobId, type, "/uploads/" + file.filename, adminId]
          );
        }

        // notifikacija Einbläser tehničaru
        await db.query(
          `
          INSERT INTO notifications (user_id, title, message)
          VALUES (?, ?, ?)
        `,
          [
            forward_user_id,
            "Novi nalog za Einblasen",
            `Dodijeljen ti je novi nalog za Einblasen (iz Tiefbau naloga ${job.order_number || job.id}).`,
          ]
        );
      }

      ok(
        res,
        { newJobId },
        newJobId
          ? "Nalog odobren i proslijeđen na Einblasen"
          : "Nalog odobren"
      );
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/jobs/:id/reject
 */
router.post(
  "/:id/reject",
  auth(["ADMIN", "SEMI_ADMIN"]),
  async (req, res, next) => {
    try {
      const jobId = req.params.id;
      const { reason } = req.body;
      const adminId = req.user.id;
      const db = getDb();

      if (!reason || !reason.trim()) {
        return fail(res, 400, "Razlog odbijanja je obavezan");
      }

      const [jobs] = await db.query("SELECT * FROM jobs WHERE id = ?", [
        jobId,
      ]);
      const job = jobs[0];

      if (!job) return fail(res, 404, "Nalog ne postoji");

      await db.query(
        "UPDATE jobs SET status = 'REJECTED', admin_comment = ? WHERE id = ?",
        [reason, jobId]
      );

      await db.query(
        `
        INSERT INTO job_status_history
        (job_id, old_status, new_status, changed_by, comment)
        VALUES (?, ?, ?, ?, ?)
      `,
        [jobId, job.status, "REJECTED", adminId, reason]
      );

      if (job.assigned_user_id) {
        await db.query(
          `
          INSERT INTO notifications (user_id, title, message)
          VALUES (?, ?, ?)
        `,
          [
            job.assigned_user_id,
            "Nalog odbijen",
            `Nalog ${
              job.order_number || job.id
            } je odbijen. Razlog: ${reason}`,
          ]
        );
      }

      ok(res, null, "Nalog odbijen");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
