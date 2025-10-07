import { Router } from 'express';
import { getHomepageContent } from '../controller/homepage.controller.js';

const router = Router();

router.get('/', getHomepageContent);

export default router;
