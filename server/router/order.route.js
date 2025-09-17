import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import { checkout, myOrders, getOne, adminList, adminUpdateStatus } from '../controller/order.controller.js';

const r = Router();
const adminAuth = [passport.authenticate('jwt', { session: false }), rolesRequired(['admin'])];
const userAuth = passport.authenticate('jwt', { session: false });

// Customer
r.post('/checkout', userAuth, checkout);
r.get('/my', userAuth, myOrders);
r.get('/:id', userAuth, getOne);

// Admin
r.get('/', ...adminAuth, adminList);
r.patch('/:id/status', ...adminAuth, adminUpdateStatus);

export default r;
