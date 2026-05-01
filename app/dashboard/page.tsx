import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Download,
  Inbox,
  UploadCloud,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { getPendingRegistrationCount } from "@/lib/queries/pending-registrations";
import { getDashboardOverview } from "@/lib/queries/dashboard-overview";
import {
  StaffMetricCard,
  StaffPageHeader,
} from "@/components/dashboard/staff-page-section";
import { cn } from "@/lib/utils";

export default async function DashboardHomePage() {
  const [pendingCount, overview] = await Promise.all([
    getPendingRegistrationCount(),
    getDashboardOverview(),
  ]);

  const pct = overview?.submissionRatePct != null ? overview.submissionRatePct : null;
  const todayPct = pct != null ? `${pct}%` : "—";
  const barWidth = pct != null ? `${Math.min(100, Math.max(0, pct))}%` : "0%";

  const aiyanatLine =
    overview && overview.aiyanatEligibleMembers > 0
      ? `${overview.aiyanatPaidMembers} / ${overview.aiyanatEligibleMembers} paid`
      : overview
        ? `${overview.aiyanatPaidMembers} paid`
        : "—";

  const notSubmitted =
    overview && overview.totalMembersUnit > 0
      ? Math.max(0, overview.totalMembersUnit - overview.submittedToday)
      : 0;

  return (
    <div className="space-y-8 md:space-y-10">
      <StaffPageHeader
        title="Overview"
        description="Unit activity for your scope — refreshed on load."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StaffMetricCard
          label="Today"
          icon={<BarChart3 />}
          iconClassName="text-sky-600 dark:text-sky-400"
          value={todayPct}
          subtitle="Submission rate"
          progress={{ widthPct: barWidth }}
          footer={
            overview ? (
              <>
                {overview.submittedToday} of {overview.totalMembersUnit} submitted
                {notSubmitted > 0 ? (
                  <span className="ml-1 font-semibold text-amber-600 dark:text-amber-400">
                    · {notSubmitted} pending
                  </span>
                ) : null}
              </>
            ) : (
              "No data"
            )
          }
        />

        <StaffMetricCard
          label="Registrations"
          icon={<UserPlus />}
          iconClassName="text-amber-500 dark:text-amber-400"
          value={pendingCount}
          valueClassName={cn(
            pendingCount > 0 && "text-amber-600 dark:text-amber-400",
          )}
          subtitle={`${pendingCount === 1 ? "Request" : "Requests"} pending review`}
          footerLink={{ href: "/dashboard/registrations", label: "Review queue" }}
        />

        <StaffMetricCard
          label="Aiyanat"
          icon={<Wallet />}
          iconClassName="text-emerald-600 dark:text-emerald-400"
          value={overview?.aiyanatMonthLabel ?? "This month"}
          valueClassName="!text-xl !font-bold md:!text-2xl"
          subtitle={aiyanatLine}
          footerLink={{ href: "/dashboard/aiyanat", label: "View Aiyanat" }}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-staff-on-surface dark:text-slate-300">
          Quick access
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              href: "/dashboard/submissions",
              icon: <UploadCloud className="size-5" aria-hidden />,
              label: "Submissions",
              desc: "Logs & contacts",
            },
            {
              href: "/dashboard/members",
              icon: <Users className="size-5" aria-hidden />,
              label: "Members",
              desc: "Member roster",
            },
            {
              href: "/dashboard/attendance",
              icon: <CalendarDays className="size-5" aria-hidden />,
              label: "Attendance",
              desc: "Programs & sessions",
            },
            {
              href: "/dashboard/notifications",
              icon: <Inbox className="size-5" aria-hidden />,
              label: "Notifications",
              desc: "Your inbox",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 rounded-2xl border border-staff-outline-variant/15 bg-staff-surface-container-lowest p-4 shadow-sm transition-all hover:border-staff-primary/30 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900 dark:hover:border-teal-900/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-staff-surface-container text-staff-on-surface-variant transition-colors group-hover:bg-staff-primary-container group-hover:text-staff-on-primary-container dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-teal-950/50 dark:group-hover:text-teal-200">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-staff-on-surface dark:text-slate-100">
                  {item.label}
                </p>
                <p className="text-xs text-staff-on-surface-variant dark:text-slate-500">
                  {item.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="staff-elevated-surface flex flex-col gap-4 rounded-2xl bg-staff-surface-container-lowest p-5 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-staff-primary-container text-staff-on-primary-container dark:bg-teal-950/50 dark:text-teal-200">
            <Download className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-staff-on-surface dark:text-slate-100">
              Export data
            </p>
            <p className="mt-0.5 text-xs text-staff-on-surface-variant dark:text-slate-400">
              Filter by date on Submissions for daily logs; contacts export includes the full list
              for your scope. Download CSV or Excel.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/submissions"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-staff-outline-variant/20 bg-staff-surface-container-low px-4 py-2 text-sm font-semibold text-staff-on-surface transition-colors hover:bg-staff-surface-container dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Open Submissions
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
