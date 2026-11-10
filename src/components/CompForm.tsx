"use client";
import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { addComp, type FormState } from "@/app/actions";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";

export default function CompForm({ carId }: { carId: string }) {
  const [state, action] = useFormState<FormState, FormData>(addComp, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form ref={ref} action={action} className="addcomp" aria-label="Log a sold listing">
      <input type="hidden" name="car_id" value={carId} />
      <input name="price" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Sold $" required aria-label="Sold price" />
      <select name="source" aria-label="Where it sold"><option>eBay</option><option>Facebook</option><option>Other</option></select>
      <input name="sold_on" type="date" defaultValue={today} aria-label="Date sold" />
      <input name="note" placeholder="Link or note (e.g. box worn)" aria-label="Link or note" />
      <div style={{ gridColumn: "1 / -1" }} className="actions">
        <SubmitButton className="btn primary small" pending="Logging…">Log sold listing</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
