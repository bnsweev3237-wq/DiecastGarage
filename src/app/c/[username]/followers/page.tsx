import FollowList from "@/components/FollowList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Followers" };

export default function Followers({ params }: { params: { username: string } }) {
  return <FollowList username={params.username} kind="followers" />;
}
