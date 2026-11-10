import type { FormState } from "@/app/actions";

export default function FormMessage({ state }: { state: FormState }) {
  if (state?.error) return <p className="msg error" role="alert">{state.error}</p>;
  if (state?.ok) return <p className="msg ok" role="status">{state.ok}</p>;
  return null;
}
