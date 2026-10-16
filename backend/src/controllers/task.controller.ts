
import type { Request, Response, NextFunction } from 'express';
import {
  updateTask,
  deleteTask,
} from '../services/task.services.js';
import { parsePositiveIntegerId } from '../lib/task-id.js';

const allowedStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH'];

export async function updateTaskController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body: unknown = req.body;

    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body)
    ) {
      res.status(400).json({
        success: false,
        message: 'Request body must be a JSON object.',
      });
      return;
    }

    const input = body as Record<string, unknown>;
    const allowedFields = [
      'title',
      'description',
      'priority',
      'estimatedMinutes',
      'dueDate',
      'status',
    ];

    const unknownFields = Object.keys(input).filter(
      (key) => !allowedFields.includes(key),
    );

    if (unknownFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Unknown field(s): ${unknownFields.join(', ')}`,
      });
      return;
    }

    if (Object.keys(input).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Provide at least one field to update.',
      });
      return;
    }

    if (
      input.title !== undefined &&
      (typeof input.title !== 'string' || !input.title.trim())
    ) {
      res.status(400).json({
        success: false,
        message: 'title must be a non-empty string.',
      });
      return;
    }

    if (
      input.description !== undefined &&
      typeof input.description !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message: 'description must be a string.',
      });
      return;
    }

    if (
      input.status !== undefined &&
      (typeof input.status !== 'string' ||
        !allowedStatuses.includes(input.status))
    ) {
      res.status(400).json({
        success: false,
        message: 'status must be TODO, IN_PROGRESS, or DONE.',
      });
      return;
    }

    if (
      input.priority !== undefined &&
      (typeof input.priority !== 'string' ||
        !allowedPriorities.includes(input.priority))
    ) {
      res.status(400).json({
        success: false,
        message: 'priority must be LOW, MEDIUM, or HIGH.',
      });
      return;
    }

    if (
      input.estimatedMinutes !== undefined &&
      (typeof input.estimatedMinutes !== 'number' ||
        !Number.isInteger(input.estimatedMinutes) ||
        input.estimatedMinutes < 1)
    ) {
      res.status(400).json({
        success: false,
        message: 'estimatedMinutes must be a positive integer.',
      });
      return;
    }

    if (input.dueDate !== undefined && input.dueDate !== null) {
      if (
        typeof input.dueDate !== 'string' ||
        Number.isNaN(Date.parse(input.dueDate))
      ) {
        res.status(400).json({
          success: false,
          message: 'dueDate must be a valid date or null.',
        });
        return;
      }
    }

    const taskId = parsePositiveIntegerId(req.params.id);

    if (taskId === null) {
      res.status(400).json({
        success: false,
        message: 'A valid positive integer task ID is required.',
      });
      return;
    }

    const task = await updateTask(taskId, {
      ...(input.title !== undefined && {
        title: input.title as string,
      }),
      ...(input.description !== undefined && {
        description: input.description as string,
      }),
      ...(input.priority !== undefined && {
        priority: input.priority as 'LOW' | 'MEDIUM' | 'HIGH',
      }),
      ...(input.estimatedMinutes !== undefined && {
        estimatedMinutes: input.estimatedMinutes as number,
      }),
      ...(input.dueDate !== undefined && {
        dueDate: input.dueDate as string | null,
      }),
      ...(input.status !== undefined && {
        status: input.status as 'TODO' | 'IN_PROGRESS' | 'DONE',
      }),
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTaskController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const taskId = parsePositiveIntegerId(req.params.id);

    if (taskId === null) {
      res.status(400).json({
        success: false,
        message: 'A valid positive integer task ID is required.',
      });
      return;
    }

    const deleted = await deleteTask(taskId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}
