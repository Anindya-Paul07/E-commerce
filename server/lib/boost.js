import SellerSubscription from '../model/seller-subscription.model.js';

const ACTIVE_STATUSES = ['trialing', 'active'];

function toKey(value) {
  return value ? value.toString() : null;
}

export async function applyBoosting(products = []) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const sellerIds = Array.from(
    new Set(
      products
        .map((product) => toKey(product.seller))
        .filter(Boolean)
    )
  );

  if (sellerIds.length === 0) return products;

  const now = new Date();

  const subscriptions = await SellerSubscription.find({
    seller: { $in: sellerIds },
    status: { $in: ACTIVE_STATUSES },
    currentPeriodEnd: { $gte: now },
  })
    .populate({ path: 'plan', select: 'priorityBoost isBoostPlan featureFlags' })
    .select('seller plan status currentPeriodEnd usage')
    .lean();

  const boostMap = new Map();
  subscriptions.forEach((subscription) => {
    const planBoost = subscription.plan?.priorityBoost || 0;
    const usageBoost = Math.min(subscription.usage?.sponsoredClicks ?? 0, 100) / 1000;
    const statusBoost = subscription.status === 'trialing' ? 0.25 : 0;
    const totalBoost = planBoost + usageBoost + statusBoost;
    const sellerKey = toKey(subscription.seller);
    const current = boostMap.get(sellerKey) || 0;
    boostMap.set(sellerKey, Math.max(current, totalBoost));
  });

  const boostedProducts = products.map((product) => {
    const manualBoost = product.boost?.boostScore || 0;
    const sellerBoost = boostMap.get(toKey(product.seller)) || 0;
    const compositeBoost = Number((manualBoost + sellerBoost).toFixed(4));
    return {
      ...product,
      boostScore: compositeBoost,
    };
  });

  boostedProducts.sort((a, b) => {
    const boostDiff = (b.boostScore || 0) - (a.boostScore || 0);
    if (Math.abs(boostDiff) > 0.000001) return boostDiff;
    const scoreDiff = (b.score || 0) - (a.score || 0);
    if (Math.abs(scoreDiff) > 0.000001) return scoreDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return boostedProducts;
}

export async function computeBoostForSeller(sellerId) {
  if (!sellerId) return 0;
  const subscription = await SellerSubscription.findOne({
    seller: sellerId,
    status: { $in: ACTIVE_STATUSES },
  })
    .populate({ path: 'plan', select: 'priorityBoost' })
    .lean();
  if (!subscription) return 0;
  const planBoost = subscription.plan?.priorityBoost || 0;
  const usageBoost = Math.min(subscription.usage?.sponsoredClicks ?? 0, 100) / 1000;
  return Number((planBoost + usageBoost).toFixed(4));
}

export async function refreshProductBoost(product) {
  if (!product) return null;
  const sellerBoost = await computeBoostForSeller(product.seller);
  const manualBoost = product.boost?.boostScore || 0;
  const composite = Number((manualBoost + sellerBoost).toFixed(4));
  return composite;
}
