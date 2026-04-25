import Link from "next/link";
import { getPendingRegistrationCount } from "@/lib/queries/pending-registrations";
import { getDashboardOverview } from "@/lib/queries/dashboard-overview";
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
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-staff-headline text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Unit activity for your scope — refreshed on load.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Submission rate */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Today
            </span>
            <span className="material-symbols-outlined text-[20px] text-blue-500">bar_chart</span>
          </div>
          <p className="font-staff-headline text-4xl font-black tabular-nums text-slate-900 dark:text-slate-100">
            {todayPct}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-500">Submission rate</p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-700"
              style={{ width: barWidth }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {overview ? (
              <>
                {overview.submittedToday} of {overview.totalMembersUnit} submitted
                {notSubmitted > 0 && (
                  <span className="ml-1 font-semibold text-amber-500">
                    · {notSubmitted} pending
                  </span>
                )}
              </>
            ) : "No data"}
          </p>
        </div>

        {/* Pending registrations */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Registrations
            </span>
            <span className="material-symbols-outlined text-[20px] text-amber-500">how_to_reg</span>
          </div>
          <p
            className={cn(
              "font-staff-headline text-4xl font-black tabular-nums",
              pendingCount > 0 ? "text-amber-500" : "text-slate-900 dark:text-slate-100",
            )}
          >
            {pendingCount}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {pendingCount === 1 ? "Request" : "Requests"} pending review
          </p>
          <div className="mt-auto pt-4">
            <Link
              href="/dashboard/registrations"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Review queue
              <span className="material-symbols-outlined text-[14px] leading-none">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Aiyanat */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Aiyanat
            </span>
            <span className="material-symbols-outlined text-[20px] text-green-500">payments</span>
          </div>
          <p className="font-staff-headline text-xl font-bold text-slate-900 dark:text-slate-100">
            {overview?.aiyanatMonthLabel ?? "This month"}
          </p>
          <p className="mt-1 text-sm text-slate-500">{aiyanatLine}</p>
          <div className="mt-auto pt-4">
            <Link
              href="/dashboard/aiyanat"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              View Aiyanat
              <span className="material-symbols-outlined text-[14px] leading-none">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick access */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Quick access
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/dashboard/submissions", icon: "cloud_upload", label: "Submissions", desc: "Logs & contacts" },
            { href: "/dashboard/members", icon: "groups", label: "Members", desc: "Member roster" },
            { href: "/dashboard/attendance", icon: "calendar_today", label: "Attendance", desc: "Programs & sessions" },
            { href: "/dashboard/notifications", icon: "mark_as_unread", label: "Notifications", desc: "Your inbox" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-blue-950 dark:group-hover:text-blue-400">
                <span className="material-symbols-outlined text-[20px] leading-none">{item.icon}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Export callout */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <span className="material-symbols-outlined text-[20px] leading-none">download</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Export data</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Filter by date on Submissions, then download CSV or Excel. Scoped to your role.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/submissions"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Open Submissions
          <span className="material-symbols-outlined text-[16px] leading-none">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
