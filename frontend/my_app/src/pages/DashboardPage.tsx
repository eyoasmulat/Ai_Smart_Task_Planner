import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Ellipsis,
  FolderKanban,
  ListTodo,
  LoaderCircle,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { generatePlan, getPlans, savePlan, type Plan, type PlanTask } from "../services/api";
import Toast from "../components/Toast";

interface DashboardPageProps {
  searchTerm: string;
}

const taskStatus = (task: PlanTask) => task.status ?? "TODO";

function formatCreatedDate(value?: string) {
  if (!value) return "Saved plan";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Saved plan" : `Created ${date.toLocaleDateString()}`;
}

function formatDueDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return {
    month: date.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    day: date.getDate(),
  };
}

export default function DashboardPage({ searchTerm }: DashboardPageProps) {
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [goal, setGoal] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [preview, setPreview] = useState<Plan | null>(null);
  const [readOnlyPreview, setReadOnlyPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const plannerRef = useRef<HTMLElement>(null);
  const goalRef = useRef<HTMLTextAreaElement>(null);
  const query = searchTerm.trim().toLowerCase();

  async function loadPlans() {
    setLoadingPlans(true);
    try {
      setPlans(await getPlans());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load saved plans.");
      setMessageType("error");
    } finally {
      setLoadingPlans(false);
    }
  }

  useEffect(() => {
    void loadPlans();
  }, []);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      plannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      goalRef.current?.focus({ preventScroll: true });
    }
  }, [searchParams]);

  const allTasks = plans.flatMap((plan) => plan.tasks ?? []);
  const completedTasks = allTasks.filter((task) => taskStatus(task) === "DONE");
  const inProgressTasks = allTasks.filter((task) => taskStatus(task) === "IN_PROGRESS");
  const todoTasks = allTasks.filter((task) => taskStatus(task) === "TODO");
  const completedPercent = allTasks.length ? (completedTasks.length / allTasks.length) * 100 : 0;
  const inProgressPercent = allTasks.length
    ? (inProgressTasks.length / allTasks.length) * 100
    : 0;
  const donutStyle = {
    background: `conic-gradient(#10b981 0 ${completedPercent}%, #2684ff ${completedPercent}% ${completedPercent + inProgressPercent}%, #e7edf7 ${completedPercent + inProgressPercent}% 100%)`,
  };
  const filteredPlans = plans.filter((plan) =>
    `${plan.title} ${plan.goalDescription} ${plan.tasks.map((task) => task.title).join(" ")}`
      .toLowerCase()
      .includes(query),
  );
  const deadlines = plans
    .flatMap((plan) =>
      plan.tasks
        .filter((task) => task.dueDate)
        .map((task) => ({ ...task, planTitle: plan.title })),
    )
    .sort((left, right) => String(left.dueDate).localeCompare(String(right.dueDate)))
    .slice(0, 5);

  function scrollToPlanner() {
    plannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    goalRef.current?.focus({ preventScroll: true });
  }

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    const selectedDate = new Date(`${targetDate}T12:00:00`);
    const today = new Date();
    const days = Math.max(1, Math.ceil((
      Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    ) / 86_400_000));

    try {
      const prompt = `${goal.trim()}\nMake a practical plan for ${days} days, ending by ${targetDate}, with ${hoursPerDay} hours available per day.`;
      const generatedPlan = await generatePlan(prompt, targetDate);
      setPreview(generatedPlan);
      setReadOnlyPreview(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not generate plan.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!preview || readOnlyPreview) return;
    setSaving(true);
    setMessage("");
    try {
      await savePlan(preview);
      setPreview(null);
      setGoal("");
      setMessage("Plan saved successfully in PostgreSQL!");
      setMessageType("success");
      await loadPlans();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save plan.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  function closePreview() {
    setPreview(null);
    setReadOnlyPreview(false);
  }

  function showPlan(plan: Plan) {
    setPreview(plan);
    setReadOnlyPreview(true);
  }

  return (
    <>
      <section id="dashboard">
        <div className="welcome">
          <span className="welcome-icon" aria-hidden="true">👋</span>
          <div className="desc">
            <h1>Welcome back!</h1>
            <p>Turn your goals into a step-by-step plan.</p>
          </div>
          <button className="primary" type="button" onClick={scrollToPlanner}>
            <Plus size={16} /> Create New Plan
          </button>
        </div>

        <div className="stats">
          <article className="stat">
            <div className="staticon"><FolderKanban size={22} /></div>
            <div><div className="num">{plans.length}</div><small>Total Plans</small><div className="trend">Your goals in one place</div></div>
          </article>
          <article className="stat">
            <div className="staticon green"><ListTodo size={22} /></div>
            <div><div className="num">{allTasks.length}</div><small>Total Tasks</small><div className="trend">Stay organized</div></div>
          </article>
          <article className="stat">
            <div className="staticon blue"><CheckCircle2 size={22} /></div>
            <div><div className="num">{completedTasks.length}</div><small>Completed Tasks</small><div className="trend">Keep going</div></div>
          </article>
          <article className="stat">
            <div className="staticon orange"><Clock3 size={22} /></div>
            <div><div className="num">{inProgressTasks.length}</div><small>In Progress Tasks</small><div className="trend">One step at a time</div></div>
          </article>
        </div>

        <Toast message={message} type={messageType} />

        <div className="dashboard-grid">
          <div className="dashboard-col">
            <section className="panel" id="plans">
              <h2 className="heading">
                <FolderKanban size={18} /> Recent Plans
                <Link to="/plans">View all <span aria-hidden="true">→</span></Link>
              </h2>
              {loadingPlans ? (
                <div className="empty">Loading saved plans...</div>
              ) : filteredPlans.length === 0 ? (
                <div className="empty">
                  {query ? "No plans match your search." : "No saved plans yet. Create your first plan below."}
                </div>
              ) : filteredPlans.slice(0, 3).map((plan, index) => {
                const done = plan.tasks.filter((task) => taskStatus(task) === "DONE").length;
                const percent = plan.tasks.length ? Math.round((done / plan.tasks.length) * 100) : 0;
                return (
                  <div className="planrow" key={plan.id ?? `${plan.title}-${index}`}>
                    <div className={`symbol ${index % 2 ? "orange" : ""}`}>
                      <FolderKanban size={25} />
                    </div>
                    <div className="planinfo">
                      <strong>{plan.title}</strong>
                      <div className="meta">{formatCreatedDate(plan.createdAt)} · {plan.tasks.length} tasks</div>
                      <span className={`bar ${index % 2 ? "green" : ""}`}><span style={{ width: `${percent}%` }} /></span>
                      <span className="caption">{done} / {plan.tasks.length} tasks</span>
                    </div>
                    <button className="secondary" type="button" aria-label={`View ${plan.title}`} onClick={() => showPlan(plan)}>
                      <Ellipsis size={17} />
                    </button>
                  </div>
                );
              })}
            </section>

            <section className="panel planner" id="planner" ref={plannerRef}>
              <h2 className="heading"><Sparkles size={18} /> AI Planner</h2>
              <p className="muted">Describe your goal and let AI create a personalized plan for you.</p>
              <form onSubmit={handleGenerate}>
                <textarea
                  ref={goalRef}
                  className="goal"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  minLength={5}
                  maxLength={2000}
                  required
                  placeholder="Example: Build a portfolio website in 7 days, working 2 hours per day..."
                />
                <div className="goal-count"><span>{goal.length}</span>/2000</div>
                <div className="controls">
                  <div className="field">
                    <label htmlFor="targetDate"><CalendarDays size={14} /> Target date</label>
                    <input
                      id="targetDate"
                      type="date"
                      min={new Date().toLocaleDateString("en-CA")}
                      value={targetDate}
                      onChange={(event) => setTargetDate(event.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="hours"><Clock3 size={14} /> Daily hours</label>
                    <input
                      id="hours"
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={hoursPerDay}
                      onChange={(event) => setHoursPerDay(event.target.value)}
                      placeholder="e.g. 2.5"
                      required
                    />
                  </div>
                  <button
                    className="primary"
                    type="submit"
                    disabled={loading || goal.trim().length < 5 || !targetDate || Number(hoursPerDay) < 0.5 || Number(hoursPerDay) > 24}
                  >
                    {loading ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />}
                    {loading ? "Generating with Gemini..." : "Generate Plan"}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <div className="rightcol">
            <section className="panel">
              <h2 className="heading"><CheckCircle2 size={18} /> Task Progress</h2>
              <div className="progress">
                <div className="donut" style={donutStyle}>
                  <div className="donut-center"><strong>{Math.round(completedPercent)}%</strong><small>Overall Progress</small></div>
                </div>
                <div className="legend">
                  <div className="legend-row"><span className="legend-dot" style={{ background: "var(--green)" }} />Completed <b>{completedTasks.length}</b></div>
                  <div className="legend-row"><span className="legend-dot" style={{ background: "var(--blue)" }} />In Progress <b>{inProgressTasks.length}</b></div>
                  <div className="legend-row"><span className="legend-dot" style={{ background: "#98a9c8" }} />To Do <b>{todoTasks.length}</b></div>
                </div>
              </div>
            </section>

            <section className="panel" id="deadlines">
              <h2 className="heading"><CalendarDays size={18} /> Upcoming Deadlines<Link to="/calendar">View all <span aria-hidden="true">→</span></Link></h2>
              {deadlines.length === 0 ? (
                <div className="empty">Add due dates to tasks to see upcoming deadlines.</div>
              ) : deadlines.map((task, index) => {
                const date = formatDueDate(task.dueDate!);
                return (
                  <div className="deadline" key={task.id ?? `${task.title}-${index}`}>
                    <div className="date"><small>{date.month}</small><strong>{date.day}</strong></div>
                    <div className="deadline-info"><strong>{task.title}</strong><p>{task.planTitle}</p></div>
                    {taskStatus(task) === "DONE" ? <Check size={17} color="var(--green)" /> : <Circle size={17} color="var(--icon-muted)" />}
                  </div>
                );
              })}
            </section>
          </div>
        </div>
      </section>

      {preview && (
        <div className="modalbg" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePreview(); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="preview-title">
            <div className="modalhead">
              <h2 id="preview-title">{preview.title || "Your AI-generated plan"}</h2>
              <button type="button" onClick={closePreview} aria-label="Close preview"><X size={18} /></button>
            </div>
            <p className="muted">{preview.goalDescription}</p>
            {preview.tasks.map((task, index) => (
              <article className="task" key={`${task.title}-${index}`}>
                <h3>{index + 1}. {task.title} <span className="pill">{task.priority}</span></h3>
                <p>{task.description}</p>
                <small className="muted">{task.estimatedMinutes} minutes{task.dueDate ? ` · Due ${task.dueDate}` : ""}</small>
              </article>
            ))}
            <div className="actions">
              <button className="secondary" type="button" onClick={closePreview}>Cancel</button>
              {!readOnlyPreview && (
                <button className="primary" type="button" onClick={() => void handleSave()} disabled={saving}>
                  {saving ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}
                  {saving ? "Saving..." : "Save Plan"}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}