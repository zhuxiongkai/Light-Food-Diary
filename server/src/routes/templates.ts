import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
  getUserTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateById,
} from '../services/templateService.js'
import { addMeal } from '../services/mealService.js'

const router = Router()
router.use(authMiddleware)

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

// List all templates
router.get('/', async (req, res, next) => {
  try {
    const templates = await getUserTemplates(req.userId)
    res.json({ code: 0, data: templates, message: 'ok' })
  } catch (err) { next(err) }
})

// Create template
router.post('/', async (req, res, next) => {
  try {
    const template = await createTemplate(req.userId, req.body)
    res.status(201).json({ code: 0, data: template, message: '创建成功' })
  } catch (err) { next(err) }
})

// Update template
router.put('/:id', async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id)
    if (!id) { res.status(400).json({ code: -1, message: '模板ID无效' }); return }
    const template = await updateTemplate(req.userId, id, req.body)
    res.json({ code: 0, data: template, message: '更新成功' })
  } catch (err) { next(err) }
})

// Delete template
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id)
    if (!id) { res.status(400).json({ code: -1, message: '模板ID无效' }); return }
    const result = await deleteTemplate(req.userId, id)
    res.json({ code: 0, data: result, message: '删除成功' })
  } catch (err) { next(err) }
})

// Apply template — creates meal records for each food
router.post('/:id/apply', async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id)
    if (!id) { res.status(400).json({ code: -1, message: '模板ID无效' }); return }

    const template = await getTemplateById(req.userId, id)
    const foods = template.foods as Array<{
      foodId: number
      foodName: string
      weight: number
      caloriesPer100g: number
      protein: number
      fat: number
      carbs: number
    }>

    const body = req.body || {}
    const targetDate: string = typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? body.date
      : new Date().toISOString().slice(0, 10)
    const targetMealType: string = typeof body.mealType === 'string' ? body.mealType : template.mealType

    const createdMeals = []
    for (const food of foods) {
      const ratio = food.weight / 100
      const meal = await addMeal(req.userId, {
        date: targetDate,
        mealType: targetMealType,
        foodId: food.foodId,
        foodName: food.foodName,
        weight: food.weight,
        calories: Math.round(food.caloriesPer100g * ratio),
        protein: parseFloat((food.protein * ratio).toFixed(1)),
        fat: parseFloat((food.fat * ratio).toFixed(1)),
        carbs: parseFloat((food.carbs * ratio).toFixed(1)),
      })
      createdMeals.push(meal)
    }

    res.status(201).json({ code: 0, data: createdMeals, message: `已应用${createdMeals.length}项食物` })
  } catch (err) { next(err) }
})

export default router
