import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { listUsers, updateUserRoles } from '../controller/admin/user.controller.js';

const router = Router();

router.use(passport.authenticate('jwt', { session: false }));
router.use(rolesRequired(['superadmin']));

router.get('/', listUsers);
router.patch('/:id/roles', updateUserRoles);

export default router;
