import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import {
  adminListSellers,
  adminGetSeller,
  adminUpdateSellerStatus,
  adminLinkSellerToPlan,
  adminUpdateSellerSubscription,
} from '../controller/admin/seller.controller.js';

const router = Router();

router.use(passport.authenticate('jwt', { session: false }));
router.use(rolesRequired(['admin', 'seller_admin']));

router.get('/', adminListSellers);
router.get('/:idOrSlug', adminGetSeller);
router.patch('/:id/status', adminUpdateSellerStatus);
router.post('/:id/subscriptions', adminLinkSellerToPlan);
router.patch('/subscriptions/:subscriptionId', adminUpdateSellerSubscription);

export default router;
