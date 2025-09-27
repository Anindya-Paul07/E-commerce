import { Router } from 'express'
import passport from 'passport'
import { rolesRequired } from '../middlewares/rolesRequired.js'
import {
  getLevels, receive, adjust, transfer, listMoves, setLowStockThreshold, listLowStock
} from '../controller/inventory.controller.js'

const r = Router()
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])]

// Admin only
r.get('/levels/:idOrSlug', ...adminAuth, getLevels)
r.post('/receive', ...adminAuth, receive)
r.post('/adjust', ...adminAuth, adjust)
r.post('/transfer', ...adminAuth, transfer)
r.get('/moves', ...adminAuth, listMoves)
r.patch('/item/:variantId/:warehouseId', ...adminAuth, setLowStockThreshold)
r.get('/low-stock', ...adminAuth, listLowStock)

export default r
