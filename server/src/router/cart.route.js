import { Router } from 'express';
import passport from 'passport';
import { getCart, addItem, updateItem, removeItem, clearCart } from '../controller/cart.controller.js';

const r = Router();
r.use(passport.authenticate('jwt', { session: false })); // customer must be logged in

r.get('/', getCart);
r.post('/add', addItem);
r.patch('/item/listing/:listingId/:variantId', updateItem);
r.delete('/item/listing/:listingId/:variantId', removeItem);
r.patch('/item/product/:productId', updateItem);
r.delete('/item/product/:productId', removeItem);
r.patch('/item/:productId', updateItem);
r.delete('/item/:productId', removeItem);
r.delete('/', clearCart);

export default r;
