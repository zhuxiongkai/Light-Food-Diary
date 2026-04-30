import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
  getMealsByDate,
  getMealsByDateRange,
  getMealStats,
  addMeal,
  updateMeal,
  deleteMeal,
} from '../services/mealService.js'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10)
    const meals = await getMealsByDate(req.userId, date)
    res.json({ code: 0, data: meals, message: 'ok' })
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
    const meals = await getMealsByDateRange(req.userId, start as string, end as string)
    res.json({ code: 0, data: meals, message: 'ok' })
  } catch (err) {
    next(err)
  }
})

router.get('/stats', async (req, res, next) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10)
    const stats = await getMealStats(req.userId, date)
    res.json({ code: 0, data: stats, message: 'ok' })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { date, mealType, foodId, foodName, weight, calories, protein, fat, carbs } = req.body
    if (!date || !mealType || !foodName) {
      res.status(400).json({ code: -1, message: '日期、餐别和食物名不能为空' })
      return
    }
    const result = await addMeal(req.userId, req.body)
    res.status(201).json({ code: 0, data: result, message: '添加成功' })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const result = await updateMeal(req.userId, id, req.body)
    res.json({ code: 0, data: result, message: '更新成功' })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const result = await deleteMeal(req.userId, id)
    res.json({ code: 0, data: result, message: '删除成功' })
  } catch (err) {
    next(err)
  }
})

export default router
