
import type { Request, Response, NextFunction } from 'express';
import {
  createPlan,
  getAllPlans,
  getPlanById,
} from '../services/plane.services.js';

export async function createPlanController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { title, goalDescription, targetDate, tasks } = req.body;

    if (
      typeof title !== 'string' ||
      !title.trim() ||
      typeof goalDescription !== 'string' ||
      !goalDescription.trim()
    ) {
      res.status(400).json({
        success: false,
        message: 'Title and goalDescription are required.',
      });
      return;
    }

    if (targetDate !== undefined && targetDate !== null) {
      if (
        typeof targetDate !== 'string' ||
        Number.isNaN(Date.parse(targetDate))
      ) {
        res.status(400).json({
          success: false,
          message: 'targetDate must be a valid date.',
        });
        return;
      }
    }

    if (tasks !== undefined && !Array.isArray(tasks)) {
      res.status(400).json({
        success: false,
        message: 'tasks must be an array.',
      });
      return;
    }

    if (
      Array.isArray(tasks) &&
      tasks.some(
        (task: unknown) =>
          typeof task !== 'object' ||
          task === null ||
          typeof (task as { title?: unknown }).title !== 'string' ||
          !(task as { title: string }).title.trim(),
      )
    ) {
      res.status(400).json({
        success: false,
        message: 'Every task must have a non-empty title.',
      });
      return;
    }

    const plan = await createPlan({
      title: title.trim(),
      goalDescription: goalDescription.trim(),
      targetDate,
      tasks,
    });

    res.status(201).json({
      success: true,
      message: 'Plan created successfully.',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllPlansController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const plans = await getAllPlans();

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPlanByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const planId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const plan = await getPlanById(planId);

    if (!plan) {
      res.status(404).json({
        success: false,
        message: 'Plan not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
}
