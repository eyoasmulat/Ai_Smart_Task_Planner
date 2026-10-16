export interface PlanTask {
  id?: number;
  googleEventId?: string | null;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  estimatedMinutes: number;
  dueDate: string | null;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  createdAt?: string;
}

export interface Plan {
  id?: number;
  title: string;
  goalDescription: string;
  targetDate?: string | null;
  tasks: PlanTask[];
  createdAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const result = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message ?? `Request failed with status ${response.status}.`);
  }

  return result.data as T;
}

export async function generatePlan(
  goal: string,
  targetDate: string,
): Promise<Plan> {
  const plan = await request<Plan>("/api/gemini/generate", {
    method: "POST",
    body: JSON.stringify({
      goal,
      ...(targetDate && { targetDate }),
    }),
  });

  return { ...plan, targetDate: targetDate || null };
}

export function savePlan(plan: Plan): Promise<Plan> {
  return request<Plan>("/api/plans", {
    method: "POST",
    body: JSON.stringify({
      title: plan.title,
      goalDescription: plan.goalDescription,
      targetDate: plan.targetDate ?? null,
      tasks: plan.tasks.map((task) => ({
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        dueDate: task.dueDate,
      })),
    }),
  });
}

export function getPlans(): Promise<Plan[]> {
  return request<Plan[]>("/api/plans");
}

export function updatePlan(
  id: number,
  input: Partial<Pick<Plan, "title" | "goalDescription" | "targetDate">>,
): Promise<Plan> {
  return request<Plan>(`/api/plans/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deletePlan(id: number): Promise<void> {
  return request<void>(`/api/plans/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function updateTask(
  id: number,
  input: Partial<Omit<PlanTask, "id" | "createdAt">>,
): Promise<PlanTask> {
  return request<PlanTask>(`/api/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTask(id: number): Promise<void> {
  return request<void>(`/api/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

interface GoogleCalendarStatusResponse {
  success: boolean;
  connected: boolean;
  message?: string;
}

export interface GoogleCalendarEventResult {
  taskId: number;
  eventId: string;
  eventLink?: string;
}

export async function getGoogleCalendarStatus(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/calendar/status`);
  const result = (await response.json().catch(() => null)) as GoogleCalendarStatusResponse | null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.message ?? `Request failed with status ${response.status}.`);
  }

  return result.connected;
}

export function getGoogleCalendarConnectUrl(): string {
  return `${API_BASE_URL}/api/calendar/connect`;
}

export function addTaskToGoogleCalendar(taskId: number): Promise<GoogleCalendarEventResult> {
  return request<GoogleCalendarEventResult>(`/api/calendar/tasks/${encodeURIComponent(taskId)}`, {
    method: "POST",
  });
}