import Coupon from '../model/coupon.model.js'
import { normalizeCode } from '../lib/coupon.utils.js'

export async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100)
    const status = (req.query.status || '').trim()
    const q = (req.query.q || '').trim()

    const filter = {}
    if (status) filter.status = status
    if (q) {
      const rx = new RegExp(q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')
      filter.$or = [{ code: rx }, { description: rx }]
    }

    const [items, total] = await Promise.all([
      Coupon.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
      Coupon.countDocuments(filter),
    ])

    res.json({ items, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { next(e) }
}

export async function getOne(req, res, next) {
  try {
    const { id } = req.params
    const coupon = await Coupon.findById(id)
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' })
    res.json({ coupon })
  } catch (e) { next(e) }
}

export async function create(req, res, next) {
  try {
    const body = { ...req.body }
    if (!body.code) return res.status(400).json({ error: 'code required' })
    body.code = normalizeCode(body.code)
    if (!body.amount && body.amount !== 0) return res.status(400).json({ error: 'amount required' })

    const exists = await Coupon.findOne({ code: body.code })
    if (exists) return res.status(409).json({ error: 'Coupon code already exists' })

    const coupon = await Coupon.create(body)
    res.status(201).json({ coupon })
  } catch (e) { next(e) }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params
    const body = { ...req.body }
    if (body.code) body.code = normalizeCode(body.code)
    if (body.code) {
      const dup = await Coupon.findOne({ code: body.code, _id: { $ne: id } })
      if (dup) return res.status(409).json({ error: 'Coupon code already exists' })
    }
    const coupon = await Coupon.findByIdAndUpdate(id, body, { new: true })
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' })
    res.json({ coupon })
  } catch (e) { next(e) }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params
    const coupon = await Coupon.findByIdAndDelete(id)
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' })
    res.json({ ok: true })
  } catch (e) { next(e) }
}
