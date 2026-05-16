import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      code: 400,
      message: '参数校验失败',
      data: error.issues,
    })
  }

  if (error instanceof Error) {
    return res.status(500).json({
      code: 500,
      message: error.message,
      data: null,
    })
  }

  return res.status(500).json({
    code: 500,
    message: '未知服务端异常',
    data: null,
  })
}
