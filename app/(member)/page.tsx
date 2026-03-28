import Link from "next/link";
import { auth } from "@/auth";
import { MemberHomeContent } from "@/components/member/home/member-home-content";
import { getMemberHomeDashboard } from "@/lib/queries/member-home";

export default async function MemberHomePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const isActiveMember =
    session?.user?.role === "MEMBER" && session.user.status === "ACTIVE";

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (!userId || !isActiveMember) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Sign in with an active member account to use this home.
        </p>
        <Link
          href="/login"
          className="inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const data = await getMemberHomeDashboard(userId);

  return <MemberHomeContent data={data} todayLabel={todayLabel} />;
}
