import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { checkout, myOrders, getOne, adminList, adminUpdateStatus } from '../controller/order.controller.js';

const r = Router();

// Customer
r.post('/checkout', passport.authenticate('jwt', { session: false }), checkout);
r.get('/my', passport.authenticate('jwt', { session: false }), myOrders);
r.get('/:id', passport.authenticate('jwt', { session: false }), getOne);

// Admin
r.get('/', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), adminList);
r.patch('/:id/status', passport.authenticate('jwt', { session: false }), rolesRequired(['admin']), adminUpdateStatus);

export default r;
