import FulfillmentTask from '../model/fulfillment-task.model.js';
import { logger } from './logger.js';

export async function queueFulfillmentForOrder(order) {
  if (!order) return;
  const items = order.items || [];
  if (!items.length) return;

  const tasks = items
    .map((item, index) => {
      const fulfillmentMode = item.metadata?.fulfillmentMode || 'platform';
      if (fulfillmentMode !== 'platform') return null;
      if (!item.product && !item.listing) return null;
      return {
        order: order._id,
        orderItemIndex: index,
        product: item.product,
        listing: item.listing,
        catalogVariant: item.catalogVariant,
        seller: item.seller,
        shop: item.shop,
        warehouse: item.warehouse,
        sku: item.sku,
        type: 'pick',
        status: 'pending',
        priority: order.compliance?.riskScore ? Math.round(order.compliance.riskScore) : 0,
        metadata: {
          qty: item.qty,
          title: item.title,
          variantTitle: item.variantTitle,
        },
      };
    })
    .filter(Boolean);

  if (!tasks.length) return;

  await FulfillmentTask.insertMany(tasks);
  logger.info({ orderId: order._id, taskCount: tasks.length }, 'Queued fulfillment tasks');
}

export async function markTaskStatus(taskId, status, message, actor) {
  const task = await FulfillmentTask.findById(taskId);
  if (!task) return null;
  task.status = status;
  task.events.push({ status, message, actor });
  await task.save();
  return task;
}

export async function listFulfillmentTasks(filter = {}, options = {}) {
  const page = Math.max(parseInt(options.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(options.limit || '20', 10), 1), 200);
  const tasks = await FulfillmentTask.find(filter)
    .sort(options.sort || '-createdAt')
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const total = await FulfillmentTask.countDocuments(filter);
  return {
    items: tasks,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}
