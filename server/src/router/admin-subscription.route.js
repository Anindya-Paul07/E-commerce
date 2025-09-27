import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import {
  listPlans,
  createPlan,
  updatePlan,
  archivePlan,
} from '../controller/subscription-plan.controller.js';

const router = Router();

router.use(passport.authenticate('jwt', { session: false }));
router.use(rolesRequired(['admin']));

router.get('/', listPlans);
router.post('/', createPlan);
router.patch('/:id', updatePlan);
router.delete('/:id', archivePlan);

export default router;
