"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

// Underlines the section you're in.
export default function NavLinks({ items }: { items: Item[] }) {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  return (
    <div className="nav-links">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={active(i.href) ? "active" : undefined} aria-current={active(i.href) ? "page" : undefined}>{i.label}</Link>
      ))}
    </div>
  );
}
