"use client";
import { useState } from "react";
import { deleteItem } from "@/app/actions";
import SubmitButton from "./SubmitButton";

export default function DeleteItem({ id }: { id: string }) {
  const [sure, setSure] = useState(false);
  if (!sure) return <button className="btn danger" type="button" onClick={() => setSure(true)}>Delete item</button>;
  return (
    <form action={deleteItem} className="actions">
      <input type="hidden" name="id" value={id} />
      <span className="hint">Delete this item, its photo, sold listings and comments?</span>
      <SubmitButton className="btn small danger" pending="Deleting…">Delete</SubmitButton>
      <button className="btn small" type="button" onClick={() => setSure(false)}>Keep</button>
    </form>
  );
}
