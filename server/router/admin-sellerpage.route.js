import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import {
  adminGetSellerPageContent,
  adminUpdateSellerPageContent,
  adminAddSellerPageItem,
  adminRemoveSellerPageItem,
  adminReorderSellerPageCollection,
} from '../controller/sellerpage.controller.js';

const router = Router();

router.use(passport.authenticate('jwt', { session: false }));
router.use(rolesRequired(['admin']));

router.get('/', adminGetSellerPageContent);
router.put('/', adminUpdateSellerPageContent);
router.patch('/', adminUpdateSellerPageContent);
router.post('/items', adminAddSellerPageItem);
router.delete('/items', adminRemoveSellerPageItem);
router.patch('/reorder', adminReorderSellerPageCollection);

export default router;
