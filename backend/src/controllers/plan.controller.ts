
import type { Request, Response, NextFunction } from 'express';
import {
  createPlan,
  deletePlan,
  getAllPlans,
  getPlanById,
  updatePlan,
} from '../services/plane.services.js';
import { parsePositiveIntegerId } from '../lib/task-id.js';

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
    const planId = parsePositiveIntegerId(req.params.id);

    if (planId === null) {
      res.status(400).json({
        success: false,
        message: 'A valid positive integer plan ID is required.',
      });
      return;
    }

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

export async function updatePlanController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input: unknown = req.body;
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      res.status(400).json({ success: false, message: 'Request body must be a JSON object.' });
      return;
    }

    const values = input as Record<string, unknown>;
    const allowedFields = ['title', 'goalDescription', 'targetDate'];
    const unknownFields = Object.keys(values).filter((key) => !allowedFields.includes(key));
    if (unknownFields.length) {
      res.status(400).json({ success: false, message: `Unknown field(s): ${unknownFields.join(', ')}` });
      return;
    }
    if (!Object.keys(values).length) {
      res.status(400).json({ success: false, message: 'Provide at least one field to update.' });
      return;
    }
    if (values.title !== undefined && (typeof values.title !== 'string' || !values.title.trim())) {
      res.status(400).json({ success: false, message: 'title must be a non-empty string.' });
      return;
    }
    if (values.goalDescription !== undefined && (typeof values.goalDescription !== 'string' || !values.goalDescription.trim())) {
      res.status(400).json({ success: false, message: 'goalDescription must be a non-empty string.' });
      return;
    }
    if (values.targetDate !== undefined && values.targetDate !== null &&
      (typeof values.targetDate !== 'string' || Number.isNaN(Date.parse(values.targetDate)))) {
      res.status(400).json({ success: false, message: 'targetDate must be a valid date or null.' });
      return;
    }

    const id = parsePositiveIntegerId(req.params.id);

    if (id === null) {
      res.status(400).json({
        success: false,
        message: 'A valid positive integer plan ID is required.',
      });
      return;
    }

    const plan = await updatePlan(id, {
      ...(values.title !== undefined && { title: (values.title as string).trim() }),
      ...(values.goalDescription !== undefined && { goalDescription: (values.goalDescription as string).trim() }),
      ...(values.targetDate !== undefined && { targetDate: values.targetDate as string | null }),
    });

    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan not found.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Plan updated successfully.', data: plan });
  } catch (error) {
    next(error);
  }
}

export async function deletePlanController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parsePositiveIntegerId(req.params.id);

    if (id === null) {
      res.status(400).json({
        success: false,
        message: 'A valid positive integer plan ID is required.',
      });
      return;
    }

    const deleted = await deletePlan(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Plan not found.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Plan and its tasks deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
