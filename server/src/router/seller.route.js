import { Router } from 'express';
import passport from 'passport';
import { submitSellerApplication, getMySellerProfile } from '../controller/seller.controller.js';

const router = Router();

router.use(passport.authenticate('jwt', { session: false }));

router.get('/me', getMySellerProfile);
router.post('/apply', submitSellerApplication);
router.put('/me', submitSellerApplication);

export default router;
