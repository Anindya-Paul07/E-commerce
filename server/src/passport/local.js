import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import User from "../model/user.model.js";

export function localStrategy() {
  return new LocalStrategy(
    { usernameField: "email", passwordField: "password", session: false },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return done(null, false, { message: "Invalid credentials" });
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match)
          return done(null, false, { message: "Invalid credentials" });
        if (user.status === "disabled")
          return done(null, false, { message: "Account disabled" });
        done(null, user);
      } catch (e) {
        done(e);
      }
    }
  );
}
