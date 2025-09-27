import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import {
  listInventory,
  getInventory,
  upsertInventory,
  updateInventory,
  deleteInventory,
} from '../controller/inventory.controller.js';

const router = Router();

router.get('/', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), listInventory);
router.get('/:id', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), getInventory);
router.post('/', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), upsertInventory);
router.patch('/:id', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), updateInventory);
router.delete('/:id', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), deleteInventory);

export default router;
