import { Request, Response } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response): void {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
}
