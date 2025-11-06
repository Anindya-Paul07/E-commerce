import { Router } from 'express';
import passport from 'passport';
import { submitSellerApplication, getMySellerProfile, getSellerStats } from '../controller/seller.controller.js';
import { getSellerStorefront, updateSellerStorefront } from '../controller/seller-storefront.controller.js';
import { upload } from '../lib/upload.js';
import { rolesRequired } from '../middlewares/rolesRequired.js';

const router = Router();

router.use(passport.authenticate('jwt', { session: false }));

router.get('/me', getMySellerProfile);
router.get('/stats', rolesRequired(['seller']), getSellerStats);
router.get('/storefront', rolesRequired(['seller']), getSellerStorefront);
router.put('/storefront', rolesRequired(['seller']), updateSellerStorefront);
const assetUpload = upload.fields([
  { name: 'shopLogo', maxCount: 1 },
  { name: 'shopCover', maxCount: 1 },
  { name: 'shopHero', maxCount: 1 },
]);

router.post('/apply', assetUpload, submitSellerApplication);
router.put('/me', assetUpload, submitSellerApplication);

export default router;
