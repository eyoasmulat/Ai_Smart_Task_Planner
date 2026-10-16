import type { Request, Response } from 'express';

export function checkHealth(
  _req: Request,
  res: Response
): void {
  res.status(200).json({
    success: true,
    message: 'AI Smart Task Planner backend is working!',
  });
}