"use client";
import { useState } from "react";
import { useFormState } from "react-dom";
import { createEvent, updateEvent, type FormState } from "@/app/actions";
import { categoriesIn } from "@/lib/categories";
import { COUNTRIES, EVENT_KINDS, US_STATES, type CalEvent } from "@/lib/events";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";

// What people can tick for "What you'll find there": the popular hobbies and the sports.
const CHOICES = [...categoriesIn("popular"), ...categoriesIn("sports")];

export default function EventForm({ event }: { event?: CalEvent }) {
  const [state, action] = useFormState<FormState, FormData>(event ? updateEvent : createEvent, undefined);
  const [country, setCountry] = useState(event?.country ?? "US");
  const [start, setStart] = useState(event?.starts_on ?? "");
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="card">
      {event && <><h3>Edit event</h3><input type="hidden" name="id" value={event.id} /></>}
      <div className="grid2">
        <div className="field full"><label className="label" htmlFor="title">Event name</label>
          <input id="title" name="title" required minLength={3} maxLength={120} defaultValue={event?.title} placeholder="Akron Area Card & Collectibles Show" /></div>
        <div className="field"><label className="label" htmlFor="kind">Kind of event</label>
          <select id="kind" name="kind" defaultValue={event?.kind ?? "show"}>{EVENT_KINDS.map((k) => <option key={k.key} value={k.key}>{k.emoji} {k.label}</option>)}</select></div>
        <div className="field"><label className="label" htmlFor="hours">Hours (optional)</label>
          <input id="hours" name="hours" maxLength={60} defaultValue={event?.hours ?? ""} placeholder="9am–3pm, early bird 8am" /></div>
        <div className="field"><label className="label" htmlFor="starts_on">First day</label>
          <input id="starts_on" name="starts_on" type="date" required min={event ? undefined : today} value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div className="field"><label className="label" htmlFor="ends_on">Last day (if more than one)</label>
          <input id="ends_on" name="ends_on" type="date" min={start || today} defaultValue={event && event.ends_on !== event.starts_on ? event.ends_on : ""} /></div>
        <div className="field"><label className="label" htmlFor="venue">Venue (optional)</label>
          <input id="venue" name="venue" maxLength={120} defaultValue={event?.venue ?? ""} placeholder="County Fairgrounds, Hall B" /></div>
        <div className="field"><label className="label" htmlFor="address">Street address (optional)</label>
          <input id="address" name="address" maxLength={200} defaultValue={event?.address ?? ""} placeholder="229 E Howe Ave" /></div>
        <div className="field"><label className="label" htmlFor="city">City</label>
          <input id="city" name="city" required maxLength={80} defaultValue={event?.city} /></div>
        <div className="field"><label className="label" htmlFor="country">Country</label>
          <select id="country" name="country" value={country} onChange={(e) => setCountry(e.target.value)}>{COUNTRIES.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></div>
        {country === "US" ? (
          <div className="field"><label className="label" htmlFor="region">State</label>
            <select id="region" name="region" required defaultValue={event?.country === "US" ? event.region : ""}>
              <option value="" disabled>Choose a state</option>{US_STATES.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></div>
        ) : (
          <div className="field"><label className="label" htmlFor="region_text">State, province or region</label>
            <input id="region_text" name="region_text" required minLength={2} maxLength={40} defaultValue={event?.country !== "US" ? event?.region : ""} placeholder="ON, NSW, Bavaria" /></div>
        )}
        <div className="field"><label className="label" htmlFor="admission">Admission (optional)</label>
          <input id="admission" name="admission" maxLength={60} defaultValue={event?.admission ?? ""} placeholder="$5, kids free" /></div>
        <div className="field full"><label className="label" htmlFor="website">Event website (optional)</label>
          <input id="website" name="website" type="url" maxLength={300} defaultValue={event?.website ?? ""} placeholder="https://…" />
          <span className="hint">The organizer&apos;s page or Facebook event, for table bookings and details.</span></div>
        <div className="field full"><label className="label" htmlFor="description">Description (optional)</label>
          <textarea id="description" name="description" maxLength={2000} rows={4} defaultValue={event?.description ?? ""} placeholder="How many tables, what dealers bring, parking, food…" /></div>
        <fieldset className="field full cat-picks">
          <legend className="label">What you&apos;ll find there (optional)</legend>
          <div>{CHOICES.map((c) => (
            <label key={c.key} className="check"><input type="checkbox" name="categories" value={c.key} defaultChecked={event?.categories.includes(c.key)} /> {c.emoji} {c.label}</label>
          ))}</div>
        </fieldset>
        {event && <div className="field full"><label className="check" htmlFor="is_cancelled"><input id="is_cancelled" name="is_cancelled" type="checkbox" defaultChecked={event.is_cancelled} /> This event is cancelled</label></div>}
      </div>
      <FormMessage state={state} />
      <div className="actions"><SubmitButton pending={event ? "Saving…" : "Posting…"}>{event ? "Save" : "Post event"}</SubmitButton></div>
    </form>
  );
}
