import { Router } from 'express';
import { publicListCatalogProducts, publicGetCatalogProduct } from '../controller/catalog-product.controller.js';
import { publicListCatalogListings, publicGetListingBySlug } from '../controller/catalog-listing.controller.js';

const router = Router();

router.get('/products', publicListCatalogProducts);
router.get('/products/:idOrSlug', publicGetCatalogProduct);
router.get('/listings', publicListCatalogListings);
router.get('/listings/:slug', publicGetListingBySlug);

export default router;
