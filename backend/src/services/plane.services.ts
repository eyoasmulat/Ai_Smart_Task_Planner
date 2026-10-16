
import { prisma } from '../lib/prisma.js';

export interface CreatePlanInput {
  title: string;
  goalDescription: string;
  targetDate?: string | null;
  tasks?: {
    title: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedMinutes?: number;
    dueDate?: string | null;
  }[];
}

export interface UpdatePlanInput {
  title?: string;
  goalDescription?: string;
  targetDate?: string | null;
}

export async function createPlan(input: CreatePlanInput) {
  return prisma.plan.create({
    data: {
      title: input.title,
      goalDescription: input.goalDescription,
      targetDate: input.targetDate
        ? new Date(input.targetDate)
        : null,
      tasks: {
        create: (input.tasks ?? []).map((task) => ({
          title: task.title,
          description: task.description ?? '',
          priority: task.priority ?? 'MEDIUM',
          estimatedMinutes: task.estimatedMinutes ?? 30,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
        })),
      },
    },
    include: {
      tasks: true,
    },
  });
}

export async function getAllPlans() {
  return prisma.plan.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      tasks: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });
}

export async function getPlanById(id: string) {
  return prisma.plan.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });
}

export async function updatePlan(id: string, input: UpdatePlanInput) {
  const existingPlan = await prisma.plan.findUnique({ where: { id } });
  if (!existingPlan) return null;

  return prisma.plan.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.goalDescription !== undefined && {
        goalDescription: input.goalDescription,
      }),
      ...(input.targetDate !== undefined && {
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
      }),
    },
    include: { tasks: true },
  });
}

export async function deletePlan(id: string) {
  const existingPlan = await prisma.plan.findUnique({ where: { id } });
  if (!existingPlan) return false;

  await prisma.plan.delete({ where: { id } });
  return true;
}
