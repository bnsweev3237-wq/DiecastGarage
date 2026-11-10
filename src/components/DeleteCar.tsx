"use client";
import { useState } from "react";
import { deleteCar } from "@/app/actions";
import SubmitButton from "./SubmitButton";

export default function DeleteCar({ id }: { id: string }) {
  const [sure, setSure] = useState(false);
  if (!sure) return <button className="btn danger" type="button" onClick={() => setSure(true)}>Delete car</button>;
  return (
    <form action={deleteCar} className="actions">
      <input type="hidden" name="id" value={id} />
      <span className="hint">Delete this car, its photo, sold listings and comments?</span>
      <SubmitButton className="btn small danger" pending="Deleting…">Delete</SubmitButton>
      <button className="btn small" type="button" onClick={() => setSure(false)}>Keep</button>
    </form>
  );
}
