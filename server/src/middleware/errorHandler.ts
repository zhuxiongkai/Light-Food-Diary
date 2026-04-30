import type { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.statusCode = statusCode
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error]', err.message)

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: -1,
      message: err.message,
    })
    return
  }

  res.status(500).json({
    code: -1,
    message: '服务器内部错误',
  })
}
