import Link from "next/link";
import { getPendingRegistrationCount } from "@/lib/queries/pending-registrations";
import { getDashboardOverview } from "@/lib/queries/dashboard-overview";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardHomePage() {
  const [pendingCount, overview] = await Promise.all([
    getPendingRegistrationCount(),
    getDashboardOverview(),
  ]);

  const todayPct =
    overview?.submissionRatePct != null
      ? `${overview.submissionRatePct}%`
      : "—";
  const aiyanatLine =
    overview && overview.aiyanatEligibleMembers > 0
      ? `${overview.aiyanatPaidMembers} / ${overview.aiyanatEligibleMembers} active members paid`
      : overview
        ? `${overview.aiyanatPaidMembers} paid (no active members in scope)`
        : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Overview
        </h1>
        <p className="text-muted-foreground text-sm">
          Unit activity and key metrics. The dashboard refreshes in the background
          about every 8 seconds while this tab is visible.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Today</CardTitle>
            <CardDescription>Submission rate (your scope)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-2xl font-semibold tabular-nums">{todayPct}</p>
            {overview ? (
              <>
                <p className="text-muted-foreground">
                  {overview.submittedToday} submitted · {overview.totalMembersUnit}{" "}
                  members in halqa stats
                </p>
                {overview.totalMembersUnit > 0 ? (
                  <p className="text-muted-foreground">
                    {Math.max(
                      0,
                      overview.totalMembersUnit - overview.submittedToday,
                    )}{" "}
                    not yet submitted today
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground">No overview data.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Aiyanat</CardTitle>
            <CardDescription>
              {overview?.aiyanatMonthLabel ?? "This month"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            <p>{aiyanatLine}</p>
            <Link
              href="/dashboard/aiyanat"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-3 inline-flex w-fit",
              )}
            >
              Open Aiyanat
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Pending</CardTitle>
            <CardDescription>Registration requests</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="text-2xl font-semibold tabular-nums">{pendingCount}</p>
            <Link
              href="/dashboard/registrations"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-fit",
              )}
            >
              Review queue
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Halqa tools</CardTitle>
            <CardDescription>
              Daily operations for your scope (submissions, roster, inbox).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Link
              href="/dashboard/submissions"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-fit",
              )}
            >
              Submissions & contacts
            </Link>
            <Link
              href="/dashboard/members"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-fit",
              )}
            >
              Members
            </Link>
            <Link
              href="/dashboard/notifications"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-fit",
              )}
            >
              Notifications inbox
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Exports</CardTitle>
            <CardDescription>
              Filter by date range on Submissions, then download CSV or Excel.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            <p>
              Exports use the same scope as your role (your halqa and gender for
              Incharge/Secretary; all halqas for Admin).
            </p>
            <Link
              href="/dashboard/submissions"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-3 inline-flex w-fit",
              )}
            >
              Open submissions & export
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
