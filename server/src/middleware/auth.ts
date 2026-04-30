import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { AppError } from './errorHandler.js'

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId: number
      username: string
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('未登录，请先登录', 401))
    return
  }

  const token = authHeader.slice(7)

  try {
    const payload = verifyAccessToken(token)
    req.userId = payload.userId
    req.username = payload.username
    next()
  } catch {
    next(new AppError('登录已过期，请重新登录', 401))
  }
}
