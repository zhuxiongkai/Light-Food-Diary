import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { recognizeFood } from '../services/aiService.js'

const router = Router()
router.use(authMiddleware)

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function normalizeBase64(input: string): string {
  return input.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '')
}

router.post('/recognize', async (req, res, next) => {
  try {
    const imageBase64Raw = String(req.body?.imageBase64 || '')
    const mediaType = String(req.body?.mediaType || '')

    if (!imageBase64Raw || !mediaType) {
      res.status(400).json({ code: -1, message: '缺少图片数据' })
      return
    }

    if (!ALLOWED_MEDIA_TYPES.has(mediaType)) {
      res.status(400).json({ code: -1, message: '仅支持 JPG、PNG、WebP 图片' })
      return
    }

    const imageBase64 = normalizeBase64(imageBase64Raw)
    if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
      res.status(400).json({ code: -1, message: '图片编码格式无效' })
      return
    }

    let imageBuffer: Buffer
    try {
      imageBuffer = Buffer.from(imageBase64, 'base64')
    } catch {
      res.status(400).json({ code: -1, message: '图片数据无法解析' })
      return
    }

    if (!imageBuffer.length) {
      res.status(400).json({ code: -1, message: '图片内容为空' })
      return
    }

    if (imageBuffer.length > MAX_IMAGE_BYTES) {
      res.status(413).json({ code: -1, message: '图片过大，请压缩到 5MB 以内' })
      return
    }

    const results = await recognizeFood(req.userId, imageBase64, mediaType)
    res.json({ code: 0, data: results, message: 'ok' })
  } catch (err) {
    next(err)
  }
})

export default router
