import { avatarUrl } from "@/lib/cars";

export default function Avatar({ path, username, size }: { path: string | null; username: string; size?: "small" }) {
  const cls = size === "small" ? "avatar small" : "avatar";
  const src = avatarUrl(path);
  return src ? <img className={cls} src={src} alt="" /> : <span className={cls} aria-hidden="true">{username.slice(0, 1)}</span>;
}
