import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { list, getOne, create, update, remove, availability } from '../controller/product.controller.js';
import { upload } from '../lib/upload.js';

const router = Router();
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])];

router.get('/', list);
router.get('/:idOrSlug/stock', availability);
router.get('/:idOrSlug', getOne);

router.post('/', ...adminAuth, upload.array('images', 10), create);
router.patch('/:id', ...adminAuth, upload.array('images', 10), update);
router.delete('/:id', ...adminAuth, remove);

export default router;
