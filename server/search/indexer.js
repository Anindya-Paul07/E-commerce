import fs from 'fs';
import path from 'path';

const INDEX_PATH = path.resolve(process.cwd(), 'tmp', 'search-index.json');
const INDEX_DIR = path.dirname(INDEX_PATH);

const state = {
  products: new Map(),
  categories: new Map(),
};

function ensureDirectory() {
  if (!fs.existsSync(INDEX_DIR)) {
    fs.mkdirSync(INDEX_DIR, { recursive: true });
  }
}

function toPlainDocument(input) {
  if (!input) return null;
  if (typeof input.toObject === 'function') {
    return input.toObject({ depopulate: true, virtuals: false });
  }
  return input;
}

function normalizeProduct(product) {
  const doc = toPlainDocument(product);
  if (!doc) return null;
  const id = doc._id || doc.id;
  if (!id) return null;

  return {
    id: id.toString(),
    slug: doc.slug || '',
    title: doc.title || '',
    description: doc.description || '',
    price: typeof doc.price === 'number' ? doc.price : Number(doc.price) || 0,
    status: doc.status || 'draft',
    brand: doc.brand || '',
    tags: Array.isArray(doc.tags) ? doc.tags.filter(Boolean) : [],
    categories: Array.isArray(doc.categories)
      ? doc.categories
          .map((category) => (category && category.toString ? category.toString() : category))
          .filter(Boolean)
      : [],
    images: Array.isArray(doc.images) ? doc.images.filter(Boolean).slice(0, 8) : [],
    boostScore: doc.boost?.boostScore || 0,
    updatedAt: new Date(doc.updatedAt || Date.now()).toISOString(),
  };
}

function normalizeCategory(category) {
  const doc = toPlainDocument(category);
  if (!doc) return null;
  const id = doc._id || doc.id;
  if (!id) return null;

  return {
    id: id.toString(),
    slug: doc.slug || '',
    name: doc.name || '',
    description: doc.description || '',
    image: doc.image || '',
    parent: doc.parent ? doc.parent.toString() : null,
    sortOrder: typeof doc.sortOrder === 'number' ? doc.sortOrder : Number(doc.sortOrder) || 0,
    updatedAt: new Date(doc.updatedAt || Date.now()).toISOString(),
  };
}

function loadIndexFromDisk() {
  try {
    if (!fs.existsSync(INDEX_PATH)) return;
    const raw = fs.readFileSync(INDEX_PATH, 'utf8');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.products)) {
      parsed.products.forEach((item) => {
        if (item?.id) state.products.set(String(item.id), item);
      });
    }
    if (Array.isArray(parsed.categories)) {
      parsed.categories.forEach((item) => {
        if (item?.id) state.categories.set(String(item.id), item);
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[search:indexer] Failed to load existing index', error.message);
    state.products.clear();
    state.categories.clear();
  }
}

function persistIndex() {
  try {
    ensureDirectory();
    const payload = {
      products: Array.from(state.products.values()),
      categories: Array.from(state.categories.values()),
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(INDEX_PATH, JSON.stringify(payload, null, 2), 'utf8');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[search:indexer] Failed to persist search index', error);
  }
}

function queueProductIndex(product) {
  const normalized = normalizeProduct(product);
  if (!normalized) return;
  state.products.set(normalized.id, normalized);
  persistIndex();
}

function removeProductFromIndex(productId) {
  if (!productId) return;
  state.products.delete(productId.toString());
  persistIndex();
}

function queueCategoryIndex(category) {
  const normalized = normalizeCategory(category);
  if (!normalized) return;
  state.categories.set(normalized.id, normalized);
  persistIndex();
}

function removeCategoryFromIndex(categoryId) {
  if (!categoryId) return;
  state.categories.delete(categoryId.toString());
  persistIndex();
}

loadIndexFromDisk();

export {
  queueProductIndex,
  removeProductFromIndex,
  queueCategoryIndex,
  removeCategoryFromIndex,
};

export default {
  queueProductIndex,
  removeProductFromIndex,
  queueCategoryIndex,
  removeCategoryFromIndex,
};
