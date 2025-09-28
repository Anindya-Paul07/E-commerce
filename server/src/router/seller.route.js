import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { submitSellerApplication, getMySellerProfile } from '../controller/seller.controller.js';
import {
  listMyListings,
  createMyListing,
  updateMyListing,
  deleteMyListing,
} from '../controller/seller-listing.controller.js';

const router = Router();

router.use(passport.authenticate('jwt', { session: false }));

router.get('/me', getMySellerProfile);
router.post('/apply', submitSellerApplication);
router.put('/me', submitSellerApplication);

const sellerRoleRequired = [rolesRequired(['seller', 'seller_admin'])];

router.get('/listings', sellerRoleRequired, listMyListings);
router.post('/listings', sellerRoleRequired, createMyListing);
router.patch('/listings/:id', sellerRoleRequired, updateMyListing);
router.delete('/listings/:id', sellerRoleRequired, deleteMyListing);

export default router;
