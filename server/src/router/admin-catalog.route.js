import { Router } from 'express';
import passport from 'passport';
import { rolesRequired } from '../middlewares/rolesRequired.js';
import {
  adminListCatalogProducts,
  adminGetCatalogProduct,
  adminCreateCatalogProduct,
  adminUpdateCatalogProduct,
  adminUpdateCatalogVariant,
  adminDeleteCatalogVariant,
} from '../controller/admin/catalog-product.controller.js';
import {
  adminListCatalogListings,
  adminGetCatalogListing,
  adminCreateCatalogListing,
  adminUpdateCatalogListing,
  adminDeleteCatalogListing,
} from '../controller/admin/catalog-listing.controller.js';

const router = Router();

router.use(passport.authenticate('jwt', { session: false }));
router.use(rolesRequired(['admin', 'superadmin']));

// Catalog products
router.get('/products', adminListCatalogProducts);
router.get('/products/:id', adminGetCatalogProduct);
router.post('/products', adminCreateCatalogProduct);
router.patch('/products/:id', adminUpdateCatalogProduct);

// Catalog variants
router.patch('/variants/:id', adminUpdateCatalogVariant);
router.delete('/variants/:id', adminDeleteCatalogVariant);

// Seller listings
router.get('/listings', adminListCatalogListings);
router.get('/listings/:id', adminGetCatalogListing);
router.post('/listings', adminCreateCatalogListing);
router.patch('/listings/:id', adminUpdateCatalogListing);
router.delete('/listings/:id', adminDeleteCatalogListing);

export default router;
