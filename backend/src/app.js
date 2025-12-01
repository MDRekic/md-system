import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import path from "path";
import userRoutes from "./routes/userRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";



const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/api/users", userRoutes);

// API routes
app.use("/api/companies", companyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

app.use("/uploads", (req, res, next) => {
  // simple static serving
  const __dirname = path.resolve();
  express.static(path.join(__dirname, "uploads"))(req, res, next);
});

// health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API OK" });
});

// error handler mora biti zadnji
app.use(errorHandler);

export default app;
