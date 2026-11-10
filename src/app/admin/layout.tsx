import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { db } = await requireAdmin();
  const { count: openReports } = await db.from("reports").select("*", { count: "exact", head: true }).eq("status", "open");
  return (
    <main className="wrap">
      <div className="head">
        <div>
          <h1>Admin</h1>
          <p>Full access to every account. Nothing you do here notifies the collector or shows on the site.</p>
        </div>
      </div>
      <nav className="actions" aria-label="Admin sections">
        <Link className="btn small" href="/admin">Overview</Link>
        <Link className={`btn small${openReports ? " flag" : ""}`} href="/admin/reports">Reports{openReports ? ` (${openReports})` : ""}</Link>
        <Link className="btn small" href="/admin/users">Users</Link>
        <Link className="btn small" href="/admin/cars">Cars</Link>
        <Link className="btn small" href="/admin/comments">Comments</Link>
        <Link className="btn small" href="/admin/log">Activity log</Link>
      </nav>
      {children}
    </main>
  );
}
