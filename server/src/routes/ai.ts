import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { recognizeFood } from '../services/aiService.js'

const router = Router()
router.use(authMiddleware)

router.post('/recognize', async (req, res, next) => {
  try {
    const { imageBase64, mediaType } = req.body
    if (!imageBase64 || !mediaType) {
      res.status(400).json({ code: -1, message: '缺少图片数据' })
      return
    }
    const results = await recognizeFood(req.userId, imageBase64, mediaType)
    res.json({ code: 0, data: results, message: 'ok' })
  } catch (err) {
    next(err)
  }
})

export default router
