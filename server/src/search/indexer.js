import { logger } from '../lib/logger.js';

export async function queueProductIndex(product) {
  if (!product) return;
  logger.debug({ productId: product._id }, 'Queue product for search indexing');
}

export async function removeProductFromIndex(productId) {
  if (!productId) return;
  logger.debug({ productId }, 'Queue product removal from search index');
}

export async function queueCategoryIndex(category) {
  if (!category) return;
  logger.debug({ categoryId: category._id }, 'Queue category for search indexing');
}

export async function removeCategoryFromIndex(categoryId) {
  if (!categoryId) return;
  logger.debug({ categoryId }, 'Queue category removal from search index');
}
