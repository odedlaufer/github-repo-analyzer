// src/utils/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError.js';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = 500;
  let message = 'Something went wrong';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Always respond with JSON
  res.status(statusCode).json({
    status: 'error',
    message,
  });
}
