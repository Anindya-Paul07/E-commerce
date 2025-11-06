import { Router } from 'express'
import passport from 'passport'
import { rolesRequired } from '../middlewares/rolesRequired.js'
import { list, getOne, create, update, remove } from '../controller/coupon.controller.js'

const r = Router()
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])]

r.get('/', ...adminAuth, list)
r.get('/:id', ...adminAuth, getOne)
r.post('/', ...adminAuth, create)
r.patch('/:id', ...adminAuth, update)
r.delete('/:id', ...adminAuth, remove)

export default r
