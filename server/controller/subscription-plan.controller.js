import SubscriptionPlan from '../model/subscription-plan.model.js';

export async function listPlans(req, res, next) {
  try {
    const activeOnly = req.query.active !== 'false';
    const filter = activeOnly ? { active: true } : {};
    const plans = await SubscriptionPlan.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean();
    res.json({ plans });
  } catch (error) {
    next(error);
  }
}

export async function createPlan(req, res, next) {
  try {
    const {
      name,
      code,
      description,
      price,
      currency,
      billingInterval,
      intervalCount,
      trialDays,
      isDefault,
      isBoostPlan,
      priorityBoost,
      featureFlags,
      sortOrder,
      active,
      metadata,
    } = req.body || {};

    if (!name || !code || price == null) {
      return res.status(400).json({ error: 'name, code, and price are required' });
    }

    const plan = await SubscriptionPlan.create({
      name,
      code,
      description,
      price,
      currency,
      billingInterval,
      intervalCount,
      trialDays,
      isDefault,
      isBoostPlan,
      priorityBoost,
      featureFlags,
      sortOrder,
      active,
      metadata,
    });

    res.status(201).json({ plan });
  } catch (error) {
    next(error);
  }
}

export async function updatePlan(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.code) {
      const exists = await SubscriptionPlan.exists({ code: updates.code, _id: { $ne: id } });
      if (exists) return res.status(409).json({ error: 'code already in use' });
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(id, updates, { new: true });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    res.json({ plan });
  } catch (error) {
    next(error);
  }
}

export async function archivePlan(req, res, next) {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, { active: false }, { new: true });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json({ plan });
  } catch (error) {
    next(error);
  }
}
