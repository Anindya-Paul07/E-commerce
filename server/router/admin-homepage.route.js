import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import {
  adminGetHomepageContent,
  adminUpdateHomepageContent,
  adminAddHomepageItem,
  adminRemoveHomepageItem,
  adminReorderHomepageCollection,
} from '../controller/homepage.controller.js';

const router = Router();

router.use(passport.authenticate('jwt', { session: false }));
router.use(rolesRequired(['admin']));

router.get('/', adminGetHomepageContent);
router.put('/', adminUpdateHomepageContent);
router.patch('/', adminUpdateHomepageContent);
router.post('/items', adminAddHomepageItem);
router.delete('/items', adminRemoveHomepageItem);
router.patch('/reorder', adminReorderHomepageCollection);

export default router;
