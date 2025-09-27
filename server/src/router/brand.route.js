import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { list, getOne, create, update, removeOne } from '../controller/brand.controller.js';

const router = Router();
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])];

router.get('/', list);
router.get('/:id', getOne);
router.post('/', ...adminAuth, create);
router.patch('/:id', ...adminAuth, update);
router.delete('/:id', ...adminAuth, removeOne);

export default router;
