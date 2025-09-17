import { Router } from "express";
import passport from "passport";
import { register, login, me, logout } from "../controller/auth.controller.js";

const router = Router();


router.post("/register", register);

router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  login
);

router.get("/me", passport.authenticate("jwt", { session: false }), me);

router.post("/logout", logout);

export default router;
