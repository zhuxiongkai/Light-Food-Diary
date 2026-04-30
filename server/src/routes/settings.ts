import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { getSettings, updateSettings } from '../services/settingsService.js'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const settings = await getSettings(req.userId)
    res.json({ code: 0, data: settings, message: 'ok' })
  } catch (err) {
    next(err)
  }
})

router.put('/', async (req, res, next) => {
  try {
    const settings = await updateSettings(req.userId, req.body)
    res.json({ code: 0, data: settings, message: '保存成功' })
  } catch (err) {
    next(err)
  }
})

export default router
