import Link from "next/link";
import { toggleFollow } from "@/app/actions";
import SubmitButton from "./SubmitButton";

type Props = { signedIn: boolean; followeeId: string; username: string; following: boolean };

export default function FollowButton({ signedIn, followeeId, username, following }: Props) {
  if (!signedIn) return <Link className="btn primary" href={`/login?next=/c/${username}`}>Follow</Link>;
  return (
    <form action={toggleFollow}>
      <input type="hidden" name="followee_id" value={followeeId} />
      <input type="hidden" name="username" value={username} />
      <input type="hidden" name="following" value={following ? "1" : "0"} />
      <SubmitButton className={following ? "btn" : "btn primary"} pending="…">{following ? "Following ✓" : "Follow"}</SubmitButton>
    </form>
  );
}
