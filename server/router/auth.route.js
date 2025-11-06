import { Router } from 'express';
import passport from 'passport';
import { register, login, me, logout } from '../controller/auth.controller.js';
import { issueCsrfToken, requireCsrf } from '../middlewares/csrf.js';
import { loginLimiter } from '../middlewares/limiters.js';

const router = Router();

router.get('/csrf', issueCsrfToken);

router.post('/register', register);

// custom callback to normalize 401 and avoid user enumeration
router.post('/login', loginLimiter, (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user/*, info*/) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    req.user = user;
    return login(req, res, next);
  })(req, res, next);
});

router.get('/me', passport.authenticate('jwt', { session: false }), me);

// CSRF for state-changing action via cookie-auth
router.post('/logout', requireCsrf, logout);

export default router;
