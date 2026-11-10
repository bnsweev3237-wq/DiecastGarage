import FollowList from "@/components/FollowList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Following" };

export default function Following({ params }: { params: { username: string } }) {
  return <FollowList username={params.username} kind="following" />;
}
