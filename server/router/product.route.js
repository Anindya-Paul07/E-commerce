import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { list, getOne, create, update, remove, availability } from '../controller/product.controller.js';

const r = Router();
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])];

// Public
r.get('/', list);
// Place the more specific route before the slug/id matcher
r.get('/:idOrSlug/stock', availability);
r.get('/:idOrSlug', getOne);

// Admin-only (toggle rolesRequired off if you want to test without admin)
r.post('/', ...adminAuth, create);
r.patch('/:id', ...adminAuth, update);
r.delete('/:id', ...adminAuth, remove);

export default r;
