import { Router } from 'express';
import { globalSearch } from '../controller/search.controller.js';

const router = Router();

router.get('/', globalSearch);

export default router;
