import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import {
  listWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from '../controller/warehouse.controller.js';

const router = Router();

router.get('/', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), listWarehouses);
router.get('/:id', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), getWarehouse);
router.post('/', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), createWarehouse);
router.patch('/:id', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), updateWarehouse);
router.delete('/:id', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), deleteWarehouse);

export default router;
