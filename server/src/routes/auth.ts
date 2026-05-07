import { Router } from 'express'
import { register, login, refreshAccessToken, getUserById } from '../services/authService.js'
import { sendRegisterEmailCode } from '../services/emailVerificationService.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req, res, next) => {
  try {
    const { username, password, email, emailCode } = req.body

    if (!username || !password) {
      res.status(400).json({ code: -1, message: '用户名和密码不能为空' })
      return
    }
    if (password.length < 6) {
      res.status(400).json({ code: -1, message: '密码至少6位' })
      return
    }

    const result = await register(username, password, email, emailCode)
    res.status(201).json({ code: 0, data: result, message: '注册成功' })
  } catch (err) {
    next(err)
  }
})

router.post('/send-email-code', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ code: -1, message: '请输入邮箱' })
      return
    }

    const result = await sendRegisterEmailCode(email)
    res.json({ code: 0, data: result, message: '验证码已发送' })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({ code: -1, message: '用户名和密码不能为空' })
      return
    }

    const result = await login(username, password)
    res.json({ code: 0, data: result, message: '登录成功' })
  } catch (err) {
    next(err)
  }
})

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      res.status(400).json({ code: -1, message: '缺少refreshToken' })
      return
    }

    const result = await refreshAccessToken(refreshToken)
    res.json({ code: 0, data: result, message: 'ok' })
  } catch (err) {
    next(err)
  }
})

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await getUserById(req.userId)
    res.json({ code: 0, data: user, message: 'ok' })
  } catch (err) {
    next(err)
  }
})

export default router
