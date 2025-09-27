import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { getAdminStats } from '../controller/stats.controller.js';

const router = Router();

router.get('/', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), getAdminStats);

export default router;
