import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import {
  adminListFulfillmentTasks,
  adminGetFulfillmentTask,
  adminUpdateFulfillmentTask,
} from '../controller/admin/fulfillment.controller.js';

const router = Router();

router.use(passport.authenticate('jwt', { session: false }));
router.use(rolesRequired(['admin']));

router.get('/', adminListFulfillmentTasks);
router.get('/:id', adminGetFulfillmentTask);
router.patch('/:id', adminUpdateFulfillmentTask);

export default router;
