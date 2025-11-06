import { Router } from 'express';
import { listPlans } from '../controller/subscription-plan.controller.js';

const router = Router();

router.get('/', listPlans);

export default router;
