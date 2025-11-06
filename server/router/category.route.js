import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { list, tree, getOne, create, update, remove, products } from '../controller/category.controller.js';
import { upload } from '../lib/upload.js';

const router = Router();
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])];

router.get('/', list);
router.get('/tree', tree);
router.get('/:idOrSlug', getOne);
router.get('/:idOrSlug/products', products);
router.post('/', ...adminAuth, upload.single('image'), create);
router.patch('/:id', ...adminAuth, upload.single('image'), update);
router.delete('/:id', ...adminAuth, remove);

export default router;
