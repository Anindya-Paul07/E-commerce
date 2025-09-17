import passport from 'passport';
import { localStrategy } from './local.js';
import { jwtStrategy } from './jwt.js';

export function initPassport() {
  passport.use('local', localStrategy());
  passport.use('jwt', jwtStrategy());
  return passport;
}
