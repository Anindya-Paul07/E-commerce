import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { ENV } from "../config/env.js";
import User from "../model/user.model.js";

export function jwtStrategy() {
  return new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.cookies?.[ENV.COOKIE_NAME],
      ]),
      secretOrKey: ENV.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.sub).select("-passwordHash");
        if (!user) return done(null, false);
        done(null, user);
      } catch (e) {
        done(e, false);
      }
    }
  );
}
