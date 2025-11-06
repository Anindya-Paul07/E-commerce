import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import {
  adminListCoupons,
  adminGetCoupon,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
} from '../controller/coupon.controller.js';

const router = Router();
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])];

router.use(...adminAuth);
router.get('/', adminListCoupons);
router.post('/', adminCreateCoupon);
router.get('/:id', adminGetCoupon);
router.put('/:id', adminUpdateCoupon);
router.delete('/:id', adminDeleteCoupon);

export default router;
