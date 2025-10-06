import { Router } from 'express';
import passport from 'passport';
import { list, getOne, create, update, remove } from '../controller/catalog-product.controller.js';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { upload } from '../lib/upload.js';

const router = Router();
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])];

router.get('/', list);
router.get('/:idOrSlug', getOne);

router.post('/', ...adminAuth, upload.array('images', 12), create);
router.patch('/:id', ...adminAuth, upload.array('images', 12), update);
router.delete('/:id', ...adminAuth, remove);

export default router;
