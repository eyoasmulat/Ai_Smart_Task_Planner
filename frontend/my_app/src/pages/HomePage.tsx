import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  FolderKanban,
  ListTodo,
  MoveUpRight,
  Menu,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { getPlans, type Plan, type PlanTask } from "../services/api";
import "../home.css";

interface HomePageProps {
  onCreatePlan: () => void;
}

const features = [
  { icon: Sparkles, title: "AI-powered planning", description: "Describe your goal in plain language and get a structured plan with manageable steps." },
  { icon: ListTodo, title: "Tasks that make sense", description: "Break a big goal into smaller tasks with priorities, estimated time, and due dates." },
  { icon: Target, title: "Track your progress", description: "See completed and remaining tasks so you can understand how far you've come." },
  { icon: CalendarDays, title: "Deadlines in one place", description: "Keep your upcoming due dates visible and plan your time with more confidence." },
  { icon: FolderKanban, title: "Save your plans", description: "Save the plans you want to keep and return to them whenever you need." },
  { icon: MoveUpRight, title: "Built to grow with you", description: "Start with AI planning and task tracking, with room for calendar integrations later." },
];

const steps = [
  { title: "Describe your goal", description: "Tell the planner what you want to achieve and how much time you can spend." },
  { title: "Review your AI plan", description: "Gemini suggests practical tasks, priorities, and estimated time for each step." },
  { title: "Save and take action", description: "Save the plan to your workspace, follow the tasks, and track your progress." },
];

function status(task: PlanTask) {
  return task.status ?? "TODO";
}

export default function HomePage({ onCreatePlan }: HomePageProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    void getPlans().then(setPlans).catch(() => setPlans([]));
  }, []);

  const tasks = plans.flatMap((plan) => plan.tasks ?? []);
  const completedCount = tasks.filter((task) => status(task) === "DONE").length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const featuredPlan = plans[0];
  const focusTasks = tasks.filter((task) => status(task) !== "DONE").slice(0, 2);

  return (
    <div className="home-root" id="home">
      <header className="home-nav">
        <div className="home-wrap home-nav-inner">
          <a className="home-brand" href="#home" aria-label="AI Task Planner home">
            <span className="home-logo"><Sparkles size={23} /></span>
            AI Task Planner
          </a>
          <nav id="home-navigation" className={`home-links${mobileMenuOpen ? " open" : ""}`} aria-label="Home page navigation">
            <a className="active" href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
          </nav>
          <div className="home-nav-actions">
            <a className="home-btn" href="#features">Explore</a>
            <button className="home-btn primary" type="button" onClick={onCreatePlan}>Create a Plan <ArrowRight size={16} /></button>
            <button
              className="home-mobile-menu-toggle"
              type="button"
              aria-label={mobileMenuOpen ? "Close page navigation" : "Open page navigation"}
              aria-controls="home-navigation"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="home-hero">
          <div className="home-wrap home-hero-grid">
            <div>
              
              <h1>Turn your goals into <em>actionable plans.</em></h1>
              <p className="home-hero-copy">Big goals become easier when you know what to do next. Describe what you want to achieve and let AI organize it into practical tasks, priorities, and deadlines.</p>
              <div className="home-hero-buttons">
                <button className="home-btn primary" type="button" onClick={onCreatePlan}><Sparkles size={15} /> Create Your First Plan</button>
                <a className="home-btn" href="#how">See how it works <ArrowRight size={15} /></a>
              </div>
              <div className="home-proof">
                <span>AI-generated task plans</span>
                <span>Clear priorities</span>
                <span>Track your progress</span>
              </div>
            </div>

            <div className="home-preview">
              <div className="home-preview-top">
                <span><Sparkles size={15} /> Your planning dashboard</span>
                <span className="home-dots" aria-hidden="true"><i /><i /><i /></span>
              </div>
              <div className="home-preview-body">
                <div className="home-preview-hello">Your goals, organized.</div>
                <div className="home-sub">A clear path from idea to achievement.</div>
                <div className="home-mini-stats">
                  <div className="home-mini-stat"><b>{String(plans.length).padStart(2, "0")}</b><small>Active plans</small></div>
                  <div className="home-mini-stat"><b>{tasks.length}</b><small>Tasks created</small></div>
                  <div className="home-mini-stat"><b>{progress}%</b><small>Progress</small></div>
                </div>
                <article className="home-mini-plan">
                  <div className="home-mini-title">
                    <span>{featuredPlan?.title ?? "Your first plan"}</span>
                    <span className="home-tag">{featuredPlan ? "In progress" : "Ready to start"}</span>
                  </div>
                  <p>{featuredPlan?.goalDescription ?? "Your goals and next steps will appear here after you create a plan."}</p>
                  <div className="home-progress-line"><span style={{ width: `${progress}%` }} /></div>
                </article>
                <article className="home-mini-plan">
                  <div className="home-mini-title"><span>Today&apos;s focus</span><span className="home-sub">{focusTasks.length} tasks</span></div>
                  {focusTasks.length ? focusTasks.map((task, index) => (
                    <p className="home-focus-task" key={task.id ?? `${task.title}-${index}`}>
                      {status(task) === "DONE" ? <Check size={14} /> : <Circle size={13} />}{task.title}
                    </p>
                  )) : <p className="home-focus-task"><CheckCircle2 size={14} /> Create a plan to see your tasks here</p>}
                </article>
                <div className="home-ai-mini">
                  <strong><Sparkles size={14} /> AI plan assistant</strong>
                  <p>Tell us your goal. Get a practical plan with tasks, time estimates, and deadlines.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section" id="features">
          <div className="home-wrap">
            <div className="home-section-head">
              <h2>A simpler way to make progress</h2>
              <p>Spend less time wondering where to start and more time moving toward your goals.</p>
            </div>
            <div className="home-features">
              {features.map(({ icon: Icon, title, description }) => (
                <article className="home-feature" key={title}>
                  <div className="home-feature-icon"><Icon size={22} /></div>
                  <h3>{title}</h3><p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section alt" id="how">
          <div className="home-wrap">
            <div className="home-section-head">
              <h2>From goal to done in three steps</h2>
              <p>A straightforward workflow designed to help you get started quickly.</p>
            </div>
            <div className="home-steps">
              {steps.map((step, index) => (
                <article className="home-step" key={step.title}>
                  <div className="home-number">{index + 1}</div>
                  <h3>{step.title}</h3><p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section" id="about">
          <div className="home-wrap">
            <div className="home-cta">
              <div>
                <h2>Make your next goal your next achievement.</h2>
                <p>Start with one goal. Get a plan. Take the first step today.</p>
              </div>
              <button className="home-btn" type="button" onClick={onCreatePlan}>Create a Plan <Sparkles size={15} /></button>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-wrap home-footer-inner">
          <strong>AI Smart Task Planner</strong>
          <span>Plan <span aria-hidden="true">•</span> Organize <span aria-hidden="true">•</span> Achieve</span>
          <span>© 2026 AI Smart Task Planner</span>
        </div>
      </footer>
    </div>
  );
}