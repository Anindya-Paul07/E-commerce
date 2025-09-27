import mongoose from 'mongoose';
import Seller from '../../model/seller.model.js';
import Shop from '../../model/shop.model.js';
import SellerSubscription from '../../model/seller-subscription.model.js';
import SubscriptionPlan from '../../model/subscription-plan.model.js';
import LedgerEntry from '../../model/ledger-entry.model.js';
import Payout from '../../model/payout.model.js';

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

export async function adminListSellers(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const status = (req.query.status || '').trim();
    const verificationStatus = (req.query.verificationStatus || '').trim();
    const q = (req.query.q || '').trim();

    const filter = {};
    if (status) filter.status = status;
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (q) {
      filter.$or = [
        { displayName: new RegExp(q, 'i') },
        { legalName: new RegExp(q, 'i') },
        { notes: new RegExp(q, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Seller.find(filter)
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: 'user', select: 'name email roles status' })
        .lean(),
      Seller.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function adminGetSeller(req, res, next) {
  try {
    const { idOrSlug } = req.params;
    const filter = isObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
    const seller = await Seller.findOne(filter)
      .populate({ path: 'user', select: 'name email roles status lastLoginAt lastLoginIp' })
      .lean();
    if (!seller) return res.status(404).json({ error: 'Seller not found' });

    const [shop, subscriptions, ledgerPreview, pendingPayouts] = await Promise.all([
      Shop.findOne({ seller: seller._id }).lean(),
      SellerSubscription.find({ seller: seller._id })
        .populate({ path: 'plan' })
        .sort('-createdAt')
        .limit(10)
        .lean(),
      LedgerEntry.find({ seller: seller._id })
        .sort('-occurredAt')
        .limit(10)
        .lean(),
      Payout.find({ seller: seller._id, status: { $in: ['pending', 'scheduled', 'processing'] } })
        .sort('scheduledFor')
        .lean(),
    ]);

    res.json({ seller, shop, subscriptions, ledgerPreview, pendingPayouts });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateSellerStatus(req, res, next) {
  try {
    const { id } = req.params;
    const {
      status,
      verificationStatus,
      onboardingStep,
      riskScore,
      notes,
      addComplianceFlag,
      resolveComplianceFlagId,
    } = req.body || {};

    const seller = await Seller.findById(id);
    if (!seller) return res.status(404).json({ error: 'Seller not found' });

    if (status && ['draft', 'pending', 'under_review', 'approved', 'suspended', 'rejected'].includes(status)) {
      seller.status = status;
    }
    if (
      verificationStatus &&
      ['not_submitted', 'pending', 'in_review', 'verified', 'rejected'].includes(verificationStatus)
    ) {
      seller.verificationStatus = verificationStatus;
    }
    if (onboardingStep) seller.onboardingStep = onboardingStep;
    if (typeof riskScore === 'number') seller.set('kyc.riskScore', riskScore);
    if (notes !== undefined) seller.notes = notes;

    if (addComplianceFlag) {
      seller.complianceFlags.push({
        code: addComplianceFlag.code || 'manual',
        level: addComplianceFlag.level || 'info',
        message: addComplianceFlag.message,
      });
    }

    if (resolveComplianceFlagId) {
      const flag = seller.complianceFlags.id(resolveComplianceFlagId);
      if (flag) flag.resolvedAt = new Date();
    }

    await seller.save();

    res.json({ seller });
  } catch (error) {
    next(error);
  }
}

export async function adminLinkSellerToPlan(req, res, next) {
  try {
    const { id } = req.params; // seller id
    const { planId, status = 'active', currentPeriodEnd, renewalEnabled = true } = req.body || {};

    if (!planId) return res.status(400).json({ error: 'planId is required' });

    const [seller, plan] = await Promise.all([
      Seller.findById(id),
      SubscriptionPlan.findById(planId),
    ]);
    if (!seller) return res.status(404).json({ error: 'Seller not found' });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const now = new Date();
    const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : computePeriodEnd(now, plan);

    const subscription = await SellerSubscription.create({
      seller: seller._id,
      plan: plan._id,
      status,
      startedAt: now,
      currentPeriodEnd: periodEnd,
      nextBillingAt: periodEnd,
      renewalEnabled,
      metadata: {
        assignedBy: req.user?._id,
      },
    });

    res.status(201).json({ subscription });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateSellerSubscription(req, res, next) {
  try {
    const { subscriptionId } = req.params;
    const { status, renewalEnabled, currentPeriodEnd } = req.body || {};

    const subscription = await SellerSubscription.findById(subscriptionId);
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });

    if (status && ['trialing', 'active', 'past_due', 'canceled', 'expired'].includes(status)) {
      subscription.status = status;
    }
    if (typeof renewalEnabled === 'boolean') subscription.renewalEnabled = renewalEnabled;
    if (currentPeriodEnd) {
      const newEnd = new Date(currentPeriodEnd);
      subscription.currentPeriodEnd = newEnd;
      subscription.nextBillingAt = newEnd;
    }

    await subscription.save();

    res.json({ subscription });
  } catch (error) {
    next(error);
  }
}

function computePeriodEnd(from, plan) {
  const dt = new Date(from);
  const count = plan.intervalCount || 1;
  switch (plan.billingInterval) {
    case 'day':
      dt.setDate(dt.getDate() + count);
      break;
    case 'week':
      dt.setDate(dt.getDate() + 7 * count);
      break;
    case 'year':
      dt.setFullYear(dt.getFullYear() + count);
      break;
    case 'month':
    default:
      dt.setMonth(dt.getMonth() + count);
      break;
  }
  return dt;
}
*** End of File
