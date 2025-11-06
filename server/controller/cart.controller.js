import Cart from '../model/cart.model.js';
import Product from '../model/product.model.js';
import SellerListing from '../model/seller-listing.model.js';
import CatalogProduct from '../model/catalog-product.model.js';
import CatalogVariant from '../model/catalog-variant.model.js';
import { evaluateCoupon } from '../lib/coupon.js';
import { reserveForCart, releaseForCart, ensureDefaultVariantForProduct } from './inventory.controller.js';


async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

async function resolveListingContext(listingId, variantId) {
  const listing = await SellerListing.findById(listingId).lean();
  if (!listing) {
    throw Object.assign(new Error('listing_not_found'), { statusCode: 404 });
  }

  const offer = (listing.offers || []).find((entry) => entry?.variant?.toString() === variantId?.toString());
  if (!offer) {
    throw Object.assign(new Error('variant_not_listed'), { statusCode: 400 });
  }

  const variant = await CatalogVariant.findById(variantId).lean();
  if (!variant) {
    throw Object.assign(new Error('catalog_variant_not_found'), { statusCode: 404 });
  }

  const catalogProduct = await CatalogProduct.findById(listing.catalogProduct).lean();
  if (!catalogProduct) {
    throw Object.assign(new Error('catalog_product_not_found'), { statusCode: 404 });
  }

  if (listing.status !== 'active' || listing.moderationState !== 'approved') {
    throw Object.assign(new Error('listing_not_available'), { statusCode: 400 });
  }

  if (catalogProduct.status !== 'active' || catalogProduct.moderationState !== 'approved') {
    throw Object.assign(new Error('catalog_product_not_available'), { statusCode: 400 });
  }

  if (variant.status !== 'active') {
    throw Object.assign(new Error('catalog_variant_not_active'), { statusCode: 400 });
  }

  if (String(variant.catalogProduct) !== String(listing.catalogProduct)) {
    throw Object.assign(new Error('catalog_variant_mismatch'), { statusCode: 400 });
  }

  if (!Number.isFinite(Number(offer.price))) {
    throw Object.assign(new Error('listing_price_invalid'), { statusCode: 400 });
  }

  return { listing, variant, catalogProduct, offer };
}

function findCartItemIndex(cart, { listingId, variantId, productId }) {
  if (listingId && variantId) {
    return cart.items.findIndex(
      (item) =>
        item.listing &&
        item.catalogVariant &&
        String(item.listing) === String(listingId) &&
        String(item.catalogVariant) === String(variantId)
    );
  }
  if (productId) {
    return cart.items.findIndex((item) => item.product && String(item.product) === String(productId));
  }
  return -1;
}

function cartResponse(cart) {
  const subtotal = cart.subtotal();
  const discount = cart.discountTotal();
  return {
    cart,
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
  };
}

async function refreshCartCoupon(cart, userId) {
  if (!cart?.coupon?.code) return false;
  try {
    const subtotal = cart.subtotal();
    const { coupon, payload } = await evaluateCoupon({
      code: cart.coupon.code,
      userId,
      subtotal,
    });
    const existingMetadata = cart.coupon.metadata || {};
    const nextMetadata = {
      ...existingMetadata,
      couponId: existingMetadata.couponId || coupon._id,
    };
    const appliedAt = cart.coupon.appliedAt || new Date();
    const nextCoupon = {
      ...payload,
      metadata: nextMetadata,
      appliedAt,
    };
    const prev = cart.coupon;
    const amountsDiffer = Math.abs(Number(prev.amount || 0) - Number(nextCoupon.amount || 0)) > 0.0001;
    const typeDiffers = prev.discountType !== nextCoupon.discountType;
    const valueDiffers = Number(prev.discountValue || 0) !== Number(nextCoupon.discountValue || 0);
    const metadataDiffers =
      (prev.metadata?.couponId ? String(prev.metadata.couponId) : '') !==
      (nextMetadata.couponId ? String(nextMetadata.couponId) : '');
    if (amountsDiffer || typeDiffers || valueDiffers || metadataDiffers) {
      cart.coupon = nextCoupon;
      return true;
    }
    return false;
  } catch (error) {
    cart.coupon = undefined;
    return true;
  }
}

export async function getCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const changed = await refreshCartCoupon(cart, req.user._id);
    if (changed) {
      await cart.save();
    }
    res.json(cartResponse(cart));
  } catch (error) {
    next(error);
  }
}

export async function addItem(req, res, next) {
  try {
    const { listingId, variantId, productId, qty = 1 } = req.body || {};
    const delta = Number(qty || 1);
    if (!Number.isFinite(delta) || delta <= 0) {
      return res.status(400).json({ error: 'qty must be > 0' });
    }

    const cart = await getOrCreateCart(req.user._id);

    if (listingId && variantId) {
      try {
        const { listing, variant, catalogProduct, offer } = await resolveListingContext(listingId, variantId);

        await reserveForCart({
          userId: req.user._id,
          listingId,
          catalogVariantId: variantId,
          qty: delta,
          cartId: cart._id,
        });

        const idx = findCartItemIndex(cart, { listingId, variantId });
        if (idx >= 0) {
          cart.items[idx].qty += delta;
        } else {
          cart.items.push({
            listing: listing._id,
            catalogProduct: listing.catalogProduct,
            catalogVariant: variant._id,
            seller: listing.seller,
            title: listing.titleOverride || catalogProduct?.name || variant.title || 'Listing item',
            variantTitle: variant.title || '',
            sku: variant.sku || '',
            price: offer.price,
            image: catalogProduct?.images?.[0] || '',
            qty: delta,
            commissionRate:
              typeof listing.metadata?.commissionRate === 'number'
                ? listing.metadata.commissionRate
                : undefined,
            metadata: {
              catalogProductSlug: catalogProduct?.slug,
              listingTitle: listing.titleOverride,
              descriptionOverride: listing.descriptionOverride,
              inventoryPolicy: offer.inventoryPolicy,
              variantOptions: variant.options,
            },
          });
        }

        await refreshCartCoupon(cart, req.user._id);
        await cart.save();
        return res.status(201).json(cartResponse(cart));
      } catch (error) {
        if (error?.statusCode) {
          return res.status(error.statusCode).json({ error: error.message });
        }
        throw error;
      }
    }

    if (!productId) {
      return res.status(400).json({ error: 'listingId and variantId are required' });
    }

    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.status !== 'active') return res.status(400).json({ error: 'Product not active' });

    const idx = findCartItemIndex(cart, { productId: product._id });
    const variant = await ensureDefaultVariantForProduct(product._id);

    await reserveForCart({ userId: req.user._id, productId: product._id, qty: delta, cartId: cart._id });

    if (idx >= 0) {
      cart.items[idx].qty += delta;
    } else {
      cart.items.push({
        product: product._id,
        variant: variant?._id,
        seller: product.seller,
        shop: product.shop,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || '',
        qty: delta,
        sku: variant?.sku,
        commissionRate: product.commission?.rate,
        metadata: {
          fulfillmentMode: product.fulfillmentMode,
          visibility: product.visibility,
        },
      });
    }

    await refreshCartCoupon(cart, req.user._id);
    await cart.save();
    return res.status(201).json(cartResponse(cart));
  } catch (error) {
    next(error);
  }
}

export async function updateItem(req, res, next) {
  try {
    const { listingId, variantId, productId } = req.params;
    const { qty } = req.body || {};
    const cart = await getOrCreateCart(req.user._id);

    const idx = findCartItemIndex(cart, { listingId, variantId, productId });
    if (idx < 0) return res.status(404).json({ error: 'Item not in cart' });

    const item = cart.items[idx];
    const nextQty = Number(qty);
    if (!Number.isFinite(nextQty) || nextQty < 1) return res.status(400).json({ error: 'qty must be >= 1' });

    const delta = nextQty - item.qty;
    if (delta > 0) {
      if (item.listing && item.catalogVariant) {
        await reserveForCart({
          userId: req.user._id,
          listingId: item.listing,
          catalogVariantId: item.catalogVariant,
          qty: delta,
          cartId: cart._id,
        });
      } else if (item.product) {
        await reserveForCart({
          userId: req.user._id,
          productId: item.product,
          qty: delta,
          cartId: cart._id,
        });
      }
    } else if (delta < 0) {
      const releaseQty = Math.abs(delta);
      if (item.listing && item.catalogVariant) {
        await releaseForCart({
          userId: req.user._id,
          listingId: item.listing,
          catalogVariantId: item.catalogVariant,
          qty: releaseQty,
          cartId: cart._id,
        });
      } else if (item.product) {
        await releaseForCart({
          userId: req.user._id,
          productId: item.product,
          qty: releaseQty,
          cartId: cart._id,
        });
      }
    }

    item.qty = nextQty;
    await refreshCartCoupon(cart, req.user._id);
    await cart.save();

    res.json(cartResponse(cart));
  } catch (error) {
    next(error);
  }
}

export async function removeItem(req, res, next) {
  try {
    const { listingId, variantId, productId } = req.params;
    const cart = await getOrCreateCart(req.user._id);

    const idx = findCartItemIndex(cart, { listingId, variantId, productId });
    if (idx < 0) return res.status(404).json({ error: 'Item not in cart' });

    const [removed] = cart.items.splice(idx, 1);
    if (removed) {
      if (removed.listing && removed.catalogVariant) {
        await releaseForCart({
          userId: req.user._id,
          listingId: removed.listing,
          catalogVariantId: removed.catalogVariant,
          qty: removed.qty,
          cartId: cart._id,
        });
      } else if (removed.product) {
        await releaseForCart({
          userId: req.user._id,
          productId: removed.product,
          qty: removed.qty,
          cartId: cart._id,
        });
      }
    }

    await refreshCartCoupon(cart, req.user._id);
    await cart.save();
    res.json(cartResponse(cart));
  } catch (error) {
    next(error);
  }
}

export async function clearCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);

    const releases = cart.items.map((item) => {
      if (item.listing && item.catalogVariant) {
        return releaseForCart({
          userId: req.user._id,
          listingId: item.listing,
          catalogVariantId: item.catalogVariant,
          qty: item.qty,
          cartId: cart._id,
        });
      }
      if (item.product) {
        return releaseForCart({
          userId: req.user._id,
          productId: item.product,
          qty: item.qty,
          cartId: cart._id,
        });
      }
      return Promise.resolve();
    });

    await Promise.allSettled(releases);
    cart.items = [];
    cart.coupon = undefined;
    await cart.save();

    res.json(cartResponse(cart));
  } catch (error) {
    next(error);
  }
}

export async function applyCoupon(req, res, next) {
  try {
    const { code } = req.body || {};
    const cart = await getOrCreateCart(req.user._id);
    const { coupon, payload } = await evaluateCoupon({
      code,
      userId: req.user._id,
      subtotal: cart.subtotal(),
    });

    cart.coupon = {
      ...payload,
      metadata: {
        couponId: coupon._id,
      },
      appliedAt: new Date(),
    };
    await cart.save();

    res.json(cartResponse(cart));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
}

export async function removeCoupon(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.coupon = undefined;
    await cart.save();
    res.json(cartResponse(cart));
  } catch (error) {
    next(error);
  }
}
