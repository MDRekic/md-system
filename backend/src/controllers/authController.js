import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/userModel.js";
import { config } from "../config/env.js";
import { ok, fail } from "../utils/response.js";

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user) return fail(res, 401, "Falsche Zugangsdaten");

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return fail(res, 401, "Falsche Zugangsdaten");

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    ok(res, { token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
};
