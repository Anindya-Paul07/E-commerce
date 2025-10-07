import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { adminListThemePresets, adminSetActiveTheme, adminCreateOrUpdatePreset } from '../controller/theme.controller.js';

const router = Router();

router.use(passport.authenticate('jwt', { session: false }));
router.use(rolesRequired(['admin']));

router.get('/', adminListThemePresets);
router.post('/', adminCreateOrUpdatePreset);
router.patch('/active', adminSetActiveTheme);

export default router;
