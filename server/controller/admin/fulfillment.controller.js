import FulfillmentTask from '../../model/fulfillment-task.model.js';
import { listFulfillmentTasks, markTaskStatus } from '../../lib/fulfillment.js';

export async function adminListFulfillmentTasks(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.warehouse) filter.warehouse = req.query.warehouse;
    if (req.query.seller) filter.seller = req.query.seller;
    if (req.query.type) filter.type = req.query.type;

    const result = await listFulfillmentTasks(filter, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function adminGetFulfillmentTask(req, res, next) {
  try {
    const task = await FulfillmentTask.findById(req.params.id)
      .populate('order', 'number status shippingAddress')
      .populate('seller', 'displayName status')
      .populate('warehouse', 'name code')
      .lean();
    if (!task) return res.status(404).json({ error: 'Fulfillment task not found' });
    res.json({ task });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateFulfillmentTask(req, res, next) {
  try {
    const { status, message } = req.body || {};
    if (!status) return res.status(400).json({ error: 'status is required' });
    if (!['pending', 'in_progress', 'completed', 'canceled', 'exception'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    const task = await markTaskStatus(req.params.id, status, message, req.user?._id);
    if (!task) return res.status(404).json({ error: 'Fulfillment task not found' });
    res.json({ task });
  } catch (error) {
    next(error);
  }
}
