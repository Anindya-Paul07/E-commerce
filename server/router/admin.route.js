import { Router } from 'express'
import passport from 'passport'
import { rolesRequired } from '../middlewares/rolesRequired.js'
import { stats } from '../controller/admin.controller.js'

const r = Router()
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])]

r.get('/stats', ...adminAuth, stats)

export default r
