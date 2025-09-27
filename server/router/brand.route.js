import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { list, getOne, create, update, removeOne } from '../controller/brand.controller.js';

const r = Router();
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])];

// Public
r.get('/', list);
r.get('/:id', getOne);

// Admin-only
r.post('/', ...adminAuth, create);
r.patch('/:id', ...adminAuth, update);
r.delete('/:id', ...adminAuth, removeOne);

export default r;
