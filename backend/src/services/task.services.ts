
import { prisma } from '../lib/prisma.js';

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedMinutes?: number;
  dueDate?: string | null;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

export async function updateTask(
  id: number,
  input: UpdateTaskInput,
) {
  const existingTask = await prisma.task.findUnique({
    where: { id },
  });

  if (!existingTask) {
    return null;
  }

  return prisma.task.update({
    where: { id },
    data: {
      ...(input.title !== undefined && {
        title: input.title,
      }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.priority !== undefined && {
        priority: input.priority,
      }),
      ...(input.estimatedMinutes !== undefined && {
        estimatedMinutes: input.estimatedMinutes,
      }),
      ...(input.dueDate !== undefined && {
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      }),
      ...(input.status !== undefined && {
        status: input.status,
      }),
    },
  });
}

export async function deleteTask(id: number) {
  const existingTask = await prisma.task.findUnique({
    where: { id },
  });

  if (!existingTask) {
    return false;
  }

  await prisma.task.delete({
    where: { id },
  });

  return true;
}
