"use client";
import { useState } from "react";
import { adminGrantComp, adminRevokeComp } from "@/app/admin/actions";
import ConfirmAction from "@/components/ConfirmAction";
import SubmitButton from "@/components/SubmitButton";

type Props = { userId: string; username: string; active: boolean; granted: boolean; until: string | null; paid: boolean };

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const plusDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

// Admin card for giving a collector a free full membership, with or without an end date.
export default function CompMembership({ userId, username, active, granted, until, paid }: Props) {
  const [ends, setEnds] = useState<"never" | "date">(until ? "date" : "never");
  const [date, setDate] = useState(until ?? plusDays(365));
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="card">
      <div className="card-title"><h3>Complimentary membership</h3>
        {active ? <span className="chip sale">Active{until ? ` through ${fmt(until)}` : ", no end date"}</span>
          : granted ? <span className="chip box">Ended {until ? fmt(until) : ""}</span> : <span className="chip box">None</span>}</div>
      <p className="hint">
        A comp gives @{username} everything a paid member gets, free.
        {paid && " They also have a paid membership through Stripe; a comp doesn't change their billing."}
        {" "}They see that they have a complimentary membership and when it ends, but not who gave it or why.
      </p>

      {!open ? (
        <div className="actions">
          <button className="btn primary small" type="button" onClick={() => setOpen(true)}>{granted ? "Change or extend" : "Give a complimentary membership"}</button>
          {active && <ConfirmAction action={adminRevokeComp} fields={{ user_id: userId }} label="End it now" confirmText={`End @${username}'s complimentary membership today? They keep their items.`} />}
        </div>
      ) : (
        <form action={async (f) => { await adminGrantComp(f); setOpen(false); }} className="grid2">
          <input type="hidden" name="user_id" value={userId} />
          <div className="field full">
            <span className="label">Ends</span>
            <div className="seg small" role="radiogroup" aria-label="When it ends">
              <label className={ends === "never" ? "on" : undefined}><input type="radio" name="ends" value="never" checked={ends === "never"} onChange={() => setEnds("never")} /><b>No end date</b><span>Until you end it</span></label>
              <label className={ends === "date" ? "on" : undefined}><input type="radio" name="ends" value="date" checked={ends === "date"} onChange={() => setEnds("date")} /><b>On a date</b><span>Last day of the comp</span></label>
            </div>
          </div>
          {ends === "date" && (
            <div className="field full">
              <label className="label" htmlFor="comp_until">Last day</label>
              <input id="comp_until" name="comp_until" type="date" min={today} required value={date} onChange={(e) => setDate(e.target.value)} />
              <div className="actions">
                {[["1 month", 30], ["3 months", 91], ["6 months", 182], ["1 year", 365]].map(([l, n]) => (
                  <button key={l} type="button" className="btn small" onClick={() => setDate(plusDays(n as number))}>{l}</button>
                ))}
              </div>
            </div>
          )}
          <div className="field full"><label className="label" htmlFor="comp_reason">Reason (for the activity log)</label>
            <input id="comp_reason" name="reason" maxLength={200} placeholder="Beta tester, giveaway winner, partner" /></div>
          <div className="actions">
            <SubmitButton className="btn primary" pending="Saving…">{granted ? "Save" : "Give membership"}</SubmitButton>
            <button className="btn" type="button" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}
