import { Router } from 'express';
import passport from 'passport';
import { submitSellerApplication, getMySellerProfile } from '../controller/seller.controller.js';
import { upload } from '../lib/upload.js';

const router = Router();

router.use(passport.authenticate('jwt', { session: false }));

router.get('/me', getMySellerProfile);
const assetUpload = upload.fields([
  { name: 'shopLogo', maxCount: 1 },
  { name: 'shopCover', maxCount: 1 },
  { name: 'shopHero', maxCount: 1 },
]);

router.post('/apply', assetUpload, submitSellerApplication);
router.put('/me', assetUpload, submitSellerApplication);

export default router;
