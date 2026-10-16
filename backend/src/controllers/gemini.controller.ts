
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { generatePlanWithGemini } from '../services/gemini.service.js';

const requestSchema = z.object({
  goal: z.string().trim().min(5).max(2000),
  targetDate: z.string().date().optional(),
});

export async function generatePlanController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const validation = requestSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Please provide a goal of 5–2000 characters and an optional valid targetDate in YYYY-MM-DD format.',
      });
      return;
    }

    const { goal, targetDate } = validation.data;

    const plan = await generatePlanWithGemini(goal, targetDate);

    res.status(200).json({
      success: true,
      message: 'AI plan generated successfully.',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
}
