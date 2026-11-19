import type { GoalProgress } from "@/lib/goals";

// One goal with its progress bar.
export default function GoalBar({ g }: { g: GoalProgress }) {
  return (
    <div className={g.done ? "goal done" : "goal"}>
      <div className="goal-head"><b>{g.done ? "🎯 " : ""}{g.label}</b><span className="hint">{g.current.toLocaleString("en-US")} of {g.of.toLocaleString("en-US")}{g.done ? " · Done!" : ` · ${g.pct}%`}</span></div>
      <span className="progress" aria-hidden="true"><span style={{ width: `${g.pct}%` }} /></span>
    </div>
  );
}
