import { Router } from 'express';
import { getSellerPageContent } from '../controller/sellerpage.controller.js';

const router = Router();

router.get('/', getSellerPageContent);

export default router;
