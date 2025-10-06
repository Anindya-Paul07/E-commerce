import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { list, getOne, create, update, removeOne } from '../controller/brand.controller.js';
import { upload } from '../lib/upload.js';

const r = Router();
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])];

<<<<<<< HEAD:server/router/brand.route.js
// Public
r.get('/', list);
r.get('/:id', getOne);
=======
router.get('/', list);
router.get('/:id', getOne);
router.post('/', ...adminAuth, upload.single('logo'), create);
router.patch('/:id', ...adminAuth, upload.single('logo'), update);
router.delete('/:id', ...adminAuth, removeOne);
>>>>>>> 3edd775 (added backend controllers):server/src/router/brand.route.js

// Admin-only
r.post('/', ...adminAuth, create);
r.patch('/:id', ...adminAuth, update);
r.delete('/:id', ...adminAuth, removeOne);

export default r;
