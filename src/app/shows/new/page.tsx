import Link from "next/link";
import { redirect } from "next/navigation";
import EventForm from "@/components/EventForm";
import { getUser } from "@/lib/supabase/server";

export const metadata = { title: "Post an event" };

export default async function NewEvent() {
  const { user } = await getUser();
  if (!user) redirect("/login?next=/shows/new");
  return (
    <main className="wrap" style={{ maxWidth: 860 }}>
      <div className="head"><div><Link href="/shows">← Card shows &amp; swap meets</Link><h1>Post an event</h1>
        <p>Share an upcoming show, swap meet or meetup. Anyone can see it; you can edit or cancel it later.</p></div></div>
      <EventForm />
    </main>
  );
}
