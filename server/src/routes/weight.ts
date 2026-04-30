import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
  getWeightRecords,
  getWeightByDateRange,
  addWeightRecord,
  deleteWeightRecord,
} from '../services/weightService.js'

const router = Router()
router.use(authMiddleware)

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

router.get('/', async (req, res, next) => {
  try {
    const records = await getWeightRecords(req.userId)
    res.json({ code: 0, data: records, message: 'ok' })
  } catch (err) {
    next(err)
  }
})

router.get('/range', async (req, res, next) => {
  try {
    const { start, end } = req.query
    if (!start || !end) {
      res.status(400).json({ code: -1, message: 'start和end参数必填' })
      return
    }
    const records = await getWeightByDateRange(req.userId, start as string, end as string)
    res.json({ code: 0, data: records, message: 'ok' })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { weight, date } = req.body
    if (!Number.isFinite(Number(weight)) || Number(weight) <= 0) {
      res.status(400).json({ code: -1, message: '体重数据无效' })
      return
    }
    const result = await addWeightRecord(req.userId, Number(weight), date)
    res.status(201).json({ code: 0, data: result, message: '添加成功' })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id)
    if (!id) {
      res.status(400).json({ code: -1, message: '记录ID无效' })
      return
    }
    const result = await deleteWeightRecord(req.userId, id)
    res.json({ code: 0, data: result, message: '删除成功' })
  } catch (err) {
    next(err)
  }
})

export default router
