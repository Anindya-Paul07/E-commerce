import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { list, tree, getOne, create, update, remove, products } from '../controller/category.controller.js';
import { upload } from '../lib/upload.js';

const r = Router();
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])];

// Public
r.get('/', list);
r.get('/tree', tree);
r.get('/:idOrSlug', getOne);
r.get('/:idOrSlug/products', products);

// Admin-only
r.post('/', ...adminAuth, upload.single('image'), create);
r.patch('/:id', ...adminAuth, upload.single('image'), update);
r.delete('/:id', ...adminAuth, remove);

export default r;
