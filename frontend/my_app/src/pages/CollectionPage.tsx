import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, Edit3, FolderKanban, ListTodo, Trash2, X } from "lucide-react";
import {
  deletePlan,
  deleteTask,
  getPlans,
  updatePlan,
  updateTask,
  type Plan,
  type PlanTask,
} from "../services/api";

type CollectionKind = "plans" | "tasks" | "calendar" | "settings";

interface CollectionPageProps {
  kind: CollectionKind;
  searchTerm: string;
}

const labels: Record<CollectionKind, [string, string]> = {
  plans: ["My Plans", "All plans saved in PostgreSQL."],
  tasks: ["Tasks", "Tasks belonging to your saved plans."],
  calendar: ["Calendar", "Review the due dates on your tasks."],
  settings: ["Settings", "Application configuration."],
};

export default function CollectionPage({ kind, searchTerm }: CollectionPageProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState("");
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editingTask, setEditingTask] = useState<(PlanTask & { planTitle: string; planId?: string }) | null>(null);
  const [planDraft, setPlanDraft] = useState({ title: "", goalDescription: "", targetDate: "" });
  const [taskDraft, setTaskDraft] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as PlanTask["priority"],
    estimatedMinutes: 30,
    dueDate: "",
    status: "TODO" as NonNullable<PlanTask["status"]>,
  });
  const [saving, setSaving] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (kind === "settings") return;
    void getPlans().then(setPlans).catch((requestError: unknown) => {
      setError(requestError instanceof Error ? requestError.message : "Could not load saved plans.");
    });
  }, [kind]);

  const allTasks = plans.flatMap((plan) =>
    plan.tasks.map((task) => ({ ...task, planTitle: plan.title, planId: plan.id })),
  );
  const selectedPlanId = searchParams.get("planId");
  const query = searchTerm.trim().toLowerCase();
  const matches = (value: string) => value.toLowerCase().includes(query);
  const planItems = plans.filter((plan) => matches(`${plan.title} ${plan.goalDescription}`));
  const taskItems = allTasks.filter((task) =>
    (!selectedPlanId || task.planId === selectedPlanId) &&
    matches(`${task.title} ${task.description} ${task.planTitle}`),
  );
  const calendarItems = taskItems
    .filter((task) => task.dueDate)
    .sort((left, right) => String(left.dueDate).localeCompare(String(right.dueDate)));

  function startPlanEdit(plan: Plan) {
    setEditingPlan(plan);
    setPlanDraft({
      title: plan.title,
      goalDescription: plan.goalDescription,
      targetDate: plan.targetDate?.slice(0, 10) ?? "",
    });
    setError("");
  }

  async function handlePlanSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingPlan?.id) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updatePlan(editingPlan.id, {
        title: planDraft.title.trim(),
        goalDescription: planDraft.goalDescription.trim(),
        targetDate: planDraft.targetDate || null,
      });
      setPlans((current) => current.map((plan) => plan.id === updated.id ? updated : plan));
      setEditingPlan(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update plan.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePlanDelete(plan: Plan) {
    if (!plan.id || !window.confirm(`Delete "${plan.title}" and all its tasks?`)) return;
    setError("");
    try {
      await deletePlan(plan.id);
      setPlans((current) => current.filter((item) => item.id !== plan.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not delete plan.");
    }
  }

  function startTaskEdit(task: PlanTask & { planTitle: string; planId?: string }) {
    setEditingTask(task);
    setTaskDraft({
      title: task.title,
      description: task.description,
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes,
      dueDate: task.dueDate?.slice(0, 10) ?? "",
      status: task.status ?? "TODO",
    });
    setError("");
  }

  async function handleTaskSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTask?.id) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateTask(editingTask.id, {
        title: taskDraft.title.trim(),
        description: taskDraft.description.trim(),
        priority: taskDraft.priority,
        estimatedMinutes: Number(taskDraft.estimatedMinutes),
        dueDate: taskDraft.dueDate || null,
        status: taskDraft.status,
      });
      setPlans((current) => current.map((plan) => ({
        ...plan,
        tasks: plan.tasks.map((task) => task.id === updated.id ? updated : task),
      })));
      setEditingTask(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTaskDelete(task: PlanTask & { planTitle: string }) {
    if (!task.id || !window.confirm(`Delete task "${task.title}"?`)) return;
    setError("");
    try {
      await deleteTask(task.id);
      setPlans((current) => current.map((plan) => ({
        ...plan,
        tasks: plan.tasks.filter((item) => item.id !== task.id),
      })));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not delete task.");
    }
  }

  return (
    <section id="other">
      <div className="welcome">
        <div className="desc">
          <h1>{labels[kind][0]}</h1>
          <p>{labels[kind][1]}</p>
        </div>
        {kind !== "settings" && (
          <Link className="primary" to="/dashboard?create=1">Create New Plan</Link>
        )}
      </div>

      {error && <div role="alert" className="empty">{error}</div>}
      {kind === "settings" ? (
        <section className="panel">
          <p className="muted">This starter screen is ready for settings and Google Calendar connection later.</p>
        </section>
      ) : kind === "plans" ? (
        <section className="panel">
          {planItems.length ? (
            <div className="saved">
              {planItems.map((plan, index) => (
                <article key={plan.id ?? `${plan.title}-${index}`}>
                  <h3>{plan.title}</h3>
                  <p>{plan.goalDescription}</p>
                  <span className="pill">{plan.tasks.length} tasks</span>
                  <div className="collection-actions">
                    <Link className="secondary collection-action" to={`/tasks?planId=${plan.id ?? ""}`}>View tasks</Link>
                    <button className="secondary collection-action" type="button" onClick={() => startPlanEdit(plan)} aria-label={`Edit ${plan.title}`}><Edit3 size={15} /> Edit</button>
                    <button className="secondary collection-action danger-action" type="button" onClick={() => void handlePlanDelete(plan)} aria-label={`Delete ${plan.title}`}><Trash2 size={15} /> Delete</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">No saved plans yet. Create a plan from Dashboard.</div>
          )}
        </section>
      ) : kind === "tasks" ? (
        <section className="panel">
          {taskItems.length ? (
            <div className="saved">
              {taskItems.map((task, index) => (
                <TaskRow
                  key={task.id ?? `${task.title}-${index}`}
                  task={task}
                  onEdit={() => startTaskEdit(task)}
                  onDelete={() => void handleTaskDelete(task)}
                />
              ))}
            </div>
          ) : (
            <div className="empty">No tasks to display yet.</div>
          )}
        </section>
      ) : (
        <section className="panel">
          {calendarItems.length ? (
            calendarItems.map((task, index) => (
              <div className="deadline" key={task.id ?? `${task.title}-${index}`}>
                <div className="date">
                  <small>{new Date(`${task.dueDate!.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { month: "short" }).toUpperCase()}</small>
                  <strong>{new Date(`${task.dueDate!.slice(0, 10)}T12:00:00`).getDate()}</strong>
                </div>
                <div className="deadline-info"><strong>{task.title}</strong><p>{task.planTitle}</p></div>
                <CalendarDays size={17} color="var(--purple)" />
              </div>
            ))
          ) : (
            <div className="empty">No tasks to display yet.</div>
          )}
        </section>
      )}

      {editingPlan && (
        <div className="modalbg" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingPlan(null); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-plan-title">
            <div className="modalhead"><h2 id="edit-plan-title">Edit plan</h2><button type="button" onClick={() => setEditingPlan(null)} aria-label="Close"><X size={18} /></button></div>
            <form className="collection-form" onSubmit={(event) => void handlePlanSave(event)}>
              <label>Title<input required value={planDraft.title} onChange={(event) => setPlanDraft({ ...planDraft, title: event.target.value })} /></label>
              <label>Goal description<textarea required rows={4} value={planDraft.goalDescription} onChange={(event) => setPlanDraft({ ...planDraft, goalDescription: event.target.value })} /></label>
              <label>Target date<input type="date" value={planDraft.targetDate} onChange={(event) => setPlanDraft({ ...planDraft, targetDate: event.target.value })} /></label>
              <div className="actions"><button className="secondary" type="button" onClick={() => setEditingPlan(null)}>Cancel</button><button className="primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div>
            </form>
          </section>
        </div>
      )}

      {editingTask && (
        <div className="modalbg" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingTask(null); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-task-title">
            <div className="modalhead"><h2 id="edit-task-title">Edit task</h2><button type="button" onClick={() => setEditingTask(null)} aria-label="Close"><X size={18} /></button></div>
            <form className="collection-form" onSubmit={(event) => void handleTaskSave(event)}>
              <label>Title<input required value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} /></label>
              <label>Description<textarea rows={3} value={taskDraft.description} onChange={(event) => setTaskDraft({ ...taskDraft, description: event.target.value })} /></label>
              <div className="collection-form-grid">
                <label>Status<select value={taskDraft.status} onChange={(event) => setTaskDraft({ ...taskDraft, status: event.target.value as typeof taskDraft.status })}><option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select></label>
                <label>Priority<select value={taskDraft.priority} onChange={(event) => setTaskDraft({ ...taskDraft, priority: event.target.value as typeof taskDraft.priority })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label>
                <label>Minutes<input type="number" min="1" required value={taskDraft.estimatedMinutes} onChange={(event) => setTaskDraft({ ...taskDraft, estimatedMinutes: Number(event.target.value) })} /></label>
                <label>Due date<input type="date" value={taskDraft.dueDate} onChange={(event) => setTaskDraft({ ...taskDraft, dueDate: event.target.value })} /></label>
              </div>
              <div className="actions"><button className="secondary" type="button" onClick={() => setEditingTask(null)}>Cancel</button><button className="primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

function TaskRow({
  task,
  onEdit,
  onDelete,
}: {
  task: PlanTask & { planTitle: string };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = task.status ?? "TODO";
  const StatusIcon = status === "DONE" ? CheckCircle2 : status === "IN_PROGRESS" ? ListTodo : FolderKanban;
  return (
    <article>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <span className="pill">{status.replace("_", " ")}</span>
      <span className="pill">{task.planTitle}</span>
      {task.dueDate && <span className="pill">Due {task.dueDate.slice(0, 10)}</span>}
      <StatusIcon className="task-status-icon" size={18} />
      <div className="collection-actions">
        <button className="secondary collection-action" type="button" onClick={onEdit}><Edit3 size={15} /> Edit</button>
        <button className="secondary collection-action danger-action" type="button" onClick={onDelete}><Trash2 size={15} /> Delete</button>
      </div>
    </article>
  );
}