import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { fail } from "../utils/response.js";

export const auth = (roles = []) => {
  // roles može biti string ili niz
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return fail(res, 401, "No token provided");
    }

    const token = header.split(" ")[1];

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        return fail(res, 403, "Forbidden");
      }

      next();
    } catch (err) {
      return fail(res, 401, "Invalid token");
    }
  };
};
