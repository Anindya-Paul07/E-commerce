import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { list, getOne, create, update, remove } from '../controller/product.controller.js';

const r = Router();

// Public
r.get('/', list);
r.get('/:idOrSlug', getOne);

// Admin-only (toggle rolesRequired off if you want to test without admin)
r.post('/', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), create);
r.patch('/:id', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), update);
r.delete('/:id', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), remove);

export default r;
