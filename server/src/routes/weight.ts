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
    if (!weight || weight <= 0) {
      res.status(400).json({ code: -1, message: '体重数据无效' })
      return
    }
    const result = await addWeightRecord(req.userId, weight, date)
    res.status(201).json({ code: 0, data: result, message: '添加成功' })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const result = await deleteWeightRecord(req.userId, id)
    res.json({ code: 0, data: result, message: '删除成功' })
  } catch (err) {
    next(err)
  }
})

export default router
