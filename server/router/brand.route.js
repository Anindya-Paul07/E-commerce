import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { list, getOne, create, update, removeOne } from '../controller/brand.controller.js';
import { upload } from '../lib/upload.js';

const router = Router();
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])];

router.get('/', list);
router.get('/:id', getOne);
router.post('/', ...adminAuth, upload.single('logo'), create);
router.patch('/:id', ...adminAuth, upload.single('logo'), update);
router.delete('/:id', ...adminAuth, removeOne);

export default router;
