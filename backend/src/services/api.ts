
const API_URL = "http://localhost:3001/api";

export interface PlanTask {
  id?: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  estimatedMinutes: number;
  dueDate: string | null;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
}

export interface Plan {
  id?: string;
  title: string;
  goalDescription: string;
  targetDate: string | null;
  createdAt?: string;
  tasks: PlanTask[];
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Something went wrong.");
  }

  return result as T;
}

// Ask Gemini to generate a plan.
// This does NOT save the plan.
export async function generatePlan(
  goal: string,
  targetDate?: string
): Promise<Plan> {
  const result = await request<{ data: Plan }>("/ai/generate", {
    method: "POST",
    body: JSON.stringify({ goal, targetDate: targetDate || undefined }),
  });

  return result.data;
}

// Save a generated plan and its tasks in PostgreSQL.
export async function savePlan(plan: Plan): Promise<Plan> {
  const result = await request<{ data: Plan }>("/plans", {
    method: "POST",
    body: JSON.stringify(plan),
  });

  return result.data;
}

// Load previously saved plans from PostgreSQL.
export async function getPlans(): Promise<Plan[]> {
  const result = await request<{ data: Plan[] }>("/plans");
  return result.data;
}
