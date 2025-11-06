import { Router } from 'express';
import passport from 'passport';
import { getCart, addItem, updateItem, removeItem, clearCart, applyCoupon, removeCoupon } from '../controller/cart.controller.js';

const r = Router();
r.use(passport.authenticate('jwt', { session: false })); // customer must be logged in

r.get('/', getCart);
r.post('/add', addItem);
r.patch('/item/product/:productId', updateItem);
r.patch('/item/listing/:listingId/:variantId', updateItem);
r.delete('/item/product/:productId', removeItem);
r.delete('/item/listing/:listingId/:variantId', removeItem);
r.post('/coupon', applyCoupon);
r.delete('/coupon', removeCoupon);
r.delete('/', clearCart);
r.post('/coupon', applyCoupon);
r.delete('/coupon', removeCoupon);

export default r;
