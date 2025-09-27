import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { list, getOne, create, update, remove, availability } from '../controller/product.controller.js';

const router = Router();
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])];

router.get('/', list);
router.get('/:idOrSlug/stock', availability);
router.get('/:idOrSlug', getOne);

router.post('/', ...adminAuth, create);
router.patch('/:id', ...adminAuth, update);
router.delete('/:id', ...adminAuth, remove);

export default router;
