import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import {
  getLevels,
  receive,
  adjust,
  transfer,
  listMoves,
  setLowStockThreshold,
  listLowStock,
} from '../controller/inventory.controller.js';

const router = Router();
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])];

router.get('/levels/:idOrSlug', ...adminAuth, getLevels);
router.post('/receive', ...adminAuth, receive);
router.post('/adjust', ...adminAuth, adjust);
router.post('/transfer', ...adminAuth, transfer);
router.get('/moves', ...adminAuth, listMoves);
router.patch('/item/:variantId/:warehouseId', ...adminAuth, setLowStockThreshold);
router.get('/low-stock', ...adminAuth, listLowStock);

export default router;
