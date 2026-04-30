import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { searchFoods, addCustomFood, updateCustomFood, deleteCustomFood } from '../services/foodService.js'

const router = Router()
router.use(authMiddleware)

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

router.get('/', async (req, res, next) => {
  try {
    const { keyword, category } = req.query
    const results = await searchFoods(req.userId, keyword as string, category as string)
    res.json({ code: 0, data: results, message: 'ok' })
  } catch (err) {
    next(err)
  }
})

router.post('/custom', async (req, res, next) => {
  try {
    const { name, category, caloriesPer100g, protein, fat, carbs } = req.body
    if (!name || !category) {
      res.status(400).json({ code: -1, message: '名称和分类不能为空' })
      return
    }
    const result = await addCustomFood(req.userId, req.body)
    res.status(201).json({ code: 0, data: result, message: '添加成功' })
  } catch (err) {
    next(err)
  }
})

router.put('/custom/:id', async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id)
    if (!id) {
      res.status(400).json({ code: -1, message: '食物ID无效' })
      return
    }
    const result = await updateCustomFood(req.userId, id, req.body)
    res.json({ code: 0, data: result, message: '更新成功' })
  } catch (err) {
    next(err)
  }
})

router.delete('/custom/:id', async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id)
    if (!id) {
      res.status(400).json({ code: -1, message: '食物ID无效' })
      return
    }
    const result = await deleteCustomFood(req.userId, id)
    res.json({ code: 0, data: result, message: '删除成功' })
  } catch (err) {
    next(err)
  }
})

export default router
