import Seller from '../model/seller.model.js';
import Shop from '../model/shop.model.js';
import User from '../model/user.model.js';

function slugify(input) {
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureUniqueSellerSlug(baseSlug, currentId = null) {
  if (!baseSlug) return null;
  let slug = baseSlug;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Seller.exists({ slug, _id: { $ne: currentId } })) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}

async function ensureUniqueShopSlug(baseSlug, currentShopId = null) {
  if (!baseSlug) return null;
  let slug = baseSlug;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Shop.exists({ slug, _id: { $ne: currentShopId } })) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}

function normalizeDocuments(documents = []) {
  if (!Array.isArray(documents)) return [];
  return documents
    .filter((doc) => doc && doc.url)
    .map((doc) => ({
      type: doc.type || 'other',
      label: doc.label,
      url: doc.url,
      status: doc.status && ['pending', 'approved', 'rejected'].includes(doc.status)
        ? doc.status
        : 'pending',
      uploadedAt: doc.uploadedAt,
      verifiedAt: doc.verifiedAt,
      verifiedBy: doc.verifiedBy,
      rejectionReason: doc.rejectionReason,
    }));
}

function mergeSection(currentSection = {}, nextSection = {}) {
  const base = typeof currentSection === 'object' && currentSection !== null
    ? currentSection.toObject?.() || currentSection
    : {};
  return { ...base, ...nextSection };
}

export async function getMySellerProfile(req, res, next) {
  try {
    const seller = await Seller.findOne({ user: req.user._id })
      .populate({ path: 'user', select: 'name email roles' })
      .lean();
    if (!seller) return res.status(404).json({ error: 'Seller profile not found' });

    const shop = await Shop.findOne({ seller: seller._id }).lean();
    res.json({ seller, shop });
  } catch (error) {
    next(error);
  }
}

export async function submitSellerApplication(req, res, next) {
  try {
    const {
      displayName,
      legalName,
      contact = {},
      warehousePreferences = {},
      kyc = {},
      payout = {},
      documents = [],
      notes,
      shop = {},
    } = req.body || {};

    if (!displayName) return res.status(400).json({ error: 'displayName is required' });

    let seller = await Seller.findOne({ user: req.user._id });
    const isNew = !seller;

    if (!seller) {
      seller = new Seller({
        user: req.user._id,
        status: 'pending',
        verificationStatus: 'pending',
        displayName,
      });
    }

    if (!seller.slug) {
      const baseSlug = slugify(displayName);
      seller.slug = await ensureUniqueSellerSlug(baseSlug, seller._id);
    }

    seller.displayName = displayName;
    if (legalName) seller.legalName = legalName;
    if (notes !== undefined) seller.notes = notes;

    seller.contact = mergeSection(seller.contact, contact);
    seller.warehousePreferences = mergeSection(seller.warehousePreferences, warehousePreferences);
    seller.kyc = mergeSection(seller.kyc, kyc);
    seller.payout = mergeSection(seller.payout, payout);
    seller.documents = normalizeDocuments(documents);

    // when seller submits, move to pending review states
    seller.status = seller.status === 'approved' ? seller.status : 'pending';
    seller.verificationStatus = ['verified', 'rejected'].includes(seller.verificationStatus)
      ? seller.verificationStatus
      : 'pending';
    seller.onboardingStep = 'awaiting_review';

    await seller.save();

    // Ensure a shop shell exists for them
    let shopDoc = await Shop.findOne({ seller: seller._id });
    if (!shopDoc) {
      const base = shop.name ? slugify(shop.name) : seller.slug;
      const uniqueSlug = await ensureUniqueShopSlug(base);
      shopDoc = await Shop.create({
        seller: seller._id,
        name: shop.name || displayName,
        slug: uniqueSlug || `${seller.slug}-shop`,
        status: 'draft',
      });
    }

    if (shop && Object.keys(shop).length > 0) {
      if (shop.name) shopDoc.name = shop.name;
      if (shop.tagLine !== undefined) shopDoc.tagLine = shop.tagLine;
      if (shop.description !== undefined) shopDoc.description = shop.description;
      if (shop.status) shopDoc.status = shop.status;
      if (shop.hero) shopDoc.hero = mergeSection(shopDoc.hero, shop.hero);
      if (shop.logoUrl !== undefined) shopDoc.logoUrl = shop.logoUrl;
      if (shop.coverImageUrl !== undefined) shopDoc.coverImageUrl = shop.coverImageUrl;
      if (shop.theme) shopDoc.theme = mergeSection(shopDoc.theme, shop.theme);
      if (shop.seo) shopDoc.seo = mergeSection(shopDoc.seo, shop.seo);
      if (shop.featureFlags) shopDoc.featureFlags = mergeSection(shopDoc.featureFlags, shop.featureFlags);
      if (Array.isArray(shop.featuredProductIds)) shopDoc.featuredProductIds = shop.featuredProductIds;
      if (Array.isArray(shop.socials)) shopDoc.socials = shop.socials;
      if (Array.isArray(shop.badges)) shopDoc.badges = shop.badges;
      if (shop.settings) shopDoc.settings = mergeSection(shopDoc.settings, shop.settings);
      if (shop.slug) {
        const baseSlug = slugify(shop.slug);
        shopDoc.slug = await ensureUniqueShopSlug(baseSlug, shopDoc._id);
      }
      await shopDoc.save();
    }

    const user = await User.findById(req.user._id);
    if (user) {
      if (!user.roles.includes('seller')) user.roles.push('seller');
      user.sellerProfile = seller._id;
      await user.save();
    }

    const payload = await Seller.findById(seller._id).lean();
    const shopPayload = await Shop.findOne({ seller: seller._id }).lean();

    res.status(isNew ? 201 : 200).json({ seller: payload, shop: shopPayload });
  } catch (error) {
    next(error);
  }
}

