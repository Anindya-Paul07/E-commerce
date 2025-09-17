import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import User from "../model/user.model.js";

export function localStrategy() {
  return new LocalStrategy(
    { usernameField: "email", passwordField: "password", session: false },
    async (email, password, done) => {
      try {
        const user = await User.findOne({
          email: (email || "").toLowerCase(),
        }).select("+passwordHash +roles +name +email");

        console.log("[AUTH] login attempt:", email);
        console.log(
          "[AUTH] user found?",
          !!user,
          "has hash?",
          !!user?.passwordHash
        );

        if (!user) return done(null, false, { message: "Invalid credentials" });

        const ok = await bcrypt.compare(password, user.passwordHash || "");
        console.log("[AUTH] password match?", ok);

        if (!ok) return done(null, false, { message: "Invalid credentials" });
        return done(null, user);
      } catch (e) {
        console.error("[AUTH] error in local strategy:", e);
        return done(e);
      }
    }
  );
}
