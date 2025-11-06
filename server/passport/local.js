import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import User from "../model/user.model.js";
import { logger } from "../lib/logger.js";

export function localStrategy() {
  return new LocalStrategy(
    { usernameField: "email", passwordField: "password", session: false },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: (email || "").toLowerCase() })
          .select("+passwordHash +roles +name +email");

        if (!user) {
          // do NOT reveal which field is wrong
          return done(null, false, { message: "Invalid credentials" });
        }

        const ok = await bcrypt.compare(password, user.passwordHash || "");
        if (!ok) return done(null, false, { message: "Invalid credentials" });

        logger.info({ email }, "[AUTH] login success");
        return done(null, user);
      } catch (e) {
        logger.error({ err: e }, "[AUTH] error in local strategy");
        return done(e);
      }
    }
  );
}