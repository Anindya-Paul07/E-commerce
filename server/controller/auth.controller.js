import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../model/user.model.js";
import { ENV } from "../config/env.js";

function signJWT(user) {
  return jwt.sign(
    { sub: user._id.toString(), roles: user.roles },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ error: 'Email already in use' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash })

    const token = signJWT(user)
    res
      .cookie(ENV.COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',               // dev-friendly. Use 'none' + secure:true in HTTPS prod across sites
        secure: ENV.COOKIE_SECURE,     // false in dev
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({
        token,                         // <— NEW: also return token
        user: { _id: user._id, name: user.name, email: user.email, roles: user.roles },
      })
  } catch (e) { next(e) }
}

export async function login(req, res, next) {
  try {
    const user = req.user // from passport-local
    const token = signJWT(user)
    res
      .cookie(ENV.COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: ENV.COOKIE_SAMESITE, 
        secure: ENV.COOKIE_SECURE,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        token,                         // <— NEW: also return token
        user: { _id: user._id, name: user.name, email: user.email, roles: user.roles },
      })
  } catch (e) { next(e) }
}

export async function me(req, res) {
  res.json({ user: req.user || null });
}

export async function logout(req, res) {
  res.clearCookie(ENV.COOKIE_NAME, {
    httpOnly: true,
    sameSite: ENV.COOKIE_SAMESITE,
    secure: ENV.COOKIE_SECURE,
  });
  res.json({ ok: true });
}
