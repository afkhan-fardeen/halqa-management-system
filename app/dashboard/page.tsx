import Link from "next/link";
import { getPendingRegistrationCount } from "@/lib/queries/pending-registrations";
import { getDashboardOverview } from "@/lib/queries/dashboard-overview";
import { cn } from "@/lib/utils";

export default async function DashboardHomePage() {
  const [pendingCount, overview] = await Promise.all([
    getPendingRegistrationCount(),
    getDashboardOverview(),
  ]);

  const pct =
    overview?.submissionRatePct != null ? overview.submissionRatePct : null;
  const todayPct = pct != null ? `${pct}%` : "—";
  const barWidth =
    pct != null ? `${Math.min(100, Math.max(0, pct))}%` : "0%";

  const aiyanatLine =
    overview && overview.aiyanatEligibleMembers > 0
      ? `${overview.aiyanatPaidMembers} / ${overview.aiyanatEligibleMembers} active members paid`
      : overview
        ? `${overview.aiyanatPaidMembers} paid (no active members in scope)`
        : "—";

  const notSubmitted =
    overview && overview.totalMembersUnit > 0
      ? Math.max(0, overview.totalMembersUnit - overview.submittedToday)
      : 0;

  return (
    <div className="space-y-10 md:space-y-12">
      <section className="mb-8 md:mb-12">
        <h1 className="font-staff-headline text-3xl font-extrabold tracking-tight text-staff-on-surface sm:text-[2.2rem] md:text-[2.75rem] md:leading-tight">
          Overview
        </h1>
        <p className="mt-2 max-w-2xl text-base text-staff-on-surface-variant md:text-lg">
          Unit activity and key metrics for your scope. Figures reload periodically
          while this tab stays open.
        </p>
      </section>

      <div className="mb-10 grid grid-cols-12 gap-6 md:gap-8 lg:mb-16">
        {/* Today */}
        <div className="col-span-12 flex flex-col justify-between rounded-xl bg-staff-surface-container-lowest p-6 shadow-[0_40px_60px_-15px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_40px_60px_-15px_rgba(0,0,0,0.06)] sm:p-8 lg:col-span-5">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-medium uppercase tracking-wide text-staff-on-surface-variant">
                Today stats
              </span>
              <span className="material-symbols-outlined text-staff-primary text-2xl">
                analytics
              </span>
            </div>
            <div className="mb-2 flex flex-wrap items-end gap-4">
              <span className="font-staff-headline text-5xl font-black text-staff-on-surface sm:text-6xl">
                {todayPct}
              </span>
              <div className="mb-1">
                <p className="text-sm font-bold text-staff-primary">Submission rate</p>
                <p className="text-xs text-staff-on-surface-variant">(your scope)</p>
              </div>
            </div>
            <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-staff-surface-container">
              <div
                className="h-full rounded-full bg-gradient-to-r from-staff-primary to-staff-primary-dim"
                style={{ width: barWidth }}
              />
            </div>
          </div>
          <div className="space-y-3">
            {overview ? (
              <>
                <div className="flex items-center gap-3 text-sm text-staff-on-surface-variant">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>
                    {overview.submittedToday} submitted · {overview.totalMembersUnit}{" "}
                    members in halqa stats
                  </span>
                </div>
                {overview.totalMembersUnit > 0 ? (
                  <div
                    className={cn(
                      "flex items-center gap-3 text-sm font-medium",
                      notSubmitted > 0 ? "text-staff-error" : "text-staff-on-surface-variant",
                    )}
                  >
                    <span className="material-symbols-outlined text-base">pending</span>
                    <span>
                      {notSubmitted} not yet submitted today
                    </span>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-staff-on-surface-variant">No overview data.</p>
            )}
          </div>
        </div>

        {/* Aiyanat */}
        <div className="col-span-12 flex flex-col justify-between rounded-xl bg-staff-surface-container-lowest p-6 shadow-[0_40px_60px_-15px_rgba(0,0,0,0.04)] sm:p-8 md:col-span-6 lg:col-span-3">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-medium uppercase tracking-wide text-staff-on-surface-variant">
                Aiyanat
              </span>
              <span className="material-symbols-outlined text-2xl text-staff-tertiary">
                account_balance_wallet
              </span>
            </div>
            <h2 className="font-staff-headline mb-2 text-2xl font-bold text-staff-on-surface sm:text-3xl">
              {overview?.aiyanatMonthLabel ?? "This month"}
            </h2>
            <p className="mb-6 text-sm font-medium text-staff-on-surface-variant">
              {aiyanatLine}
            </p>
          </div>
          <Link
            href="/dashboard/aiyanat"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-staff-surface-container-high py-3 text-sm font-bold text-staff-on-surface transition-colors hover:bg-staff-surface-container"
          >
            Open Aiyanat
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>

        {/* Pending */}
        <div className="col-span-12 flex flex-col justify-between border-l-4 border-staff-primary rounded-xl bg-staff-surface-container-lowest p-6 shadow-[0_40px_60px_-15px_rgba(0,0,0,0.04)] sm:p-8 md:col-span-6 lg:col-span-4">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-medium uppercase tracking-wide text-staff-on-surface-variant">
                Pending
              </span>
              <span className="material-symbols-outlined text-2xl text-staff-on-primary-container">
                assignment_late
              </span>
            </div>
            <p className="mb-1 text-sm text-staff-on-surface-variant">
              Registration requests
            </p>
            <p className="font-staff-headline mb-6 text-4xl font-black text-staff-on-surface sm:text-5xl">
              {pendingCount}
            </p>
          </div>
          <Link
            href="/dashboard/registrations"
            className="block w-full rounded-md border border-staff-outline-variant/30 py-3 text-center text-sm font-bold text-staff-on-surface transition-colors hover:bg-staff-surface-container-low"
          >
            Review queue
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-12 gap-8 lg:gap-12">
        <div className="col-span-12 lg:col-span-7">
          <h2 className="font-staff-headline mb-4 text-2xl font-bold text-staff-on-surface">
            Halqa tools
          </h2>
          <p className="mb-6 max-w-xl text-sm text-staff-on-surface-variant">
            Daily operations for your scope (submissions, roster, inbox).
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/dashboard/submissions"
              className="group flex max-w-full items-center gap-4 rounded-xl border border-staff-outline-variant/10 bg-staff-surface-container-lowest p-4 pr-6 shadow-sm transition-all hover:shadow-md sm:pr-8"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-staff-primary-container text-staff-on-primary-container">
                <span className="material-symbols-outlined">cloud_upload</span>
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-bold text-staff-on-surface">
                  Submissions &amp; contacts
                </p>
                <p className="text-[11px] text-staff-on-surface-variant">
                  Logs &amp; outreach
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/members"
              className="group flex max-w-full items-center gap-4 rounded-xl border border-staff-outline-variant/10 bg-staff-surface-container-lowest p-4 pr-6 shadow-sm transition-all hover:shadow-md sm:pr-8"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-staff-secondary-container text-staff-on-secondary-container">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-bold text-staff-on-surface">Members</p>
                <p className="text-[11px] text-staff-on-surface-variant">
                  Member roster
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/notifications"
              className="group flex max-w-full items-center gap-4 rounded-xl border border-staff-outline-variant/10 bg-staff-surface-container-lowest p-4 pr-6 shadow-sm transition-all hover:shadow-md sm:pr-8"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-staff-tertiary-container text-staff-on-tertiary-container">
                <span className="material-symbols-outlined">mark_as_unread</span>
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-bold text-staff-on-surface">
                  Notifications inbox
                </p>
                <p className="text-[11px] text-staff-on-surface-variant">
                  Your alerts
                </p>
              </div>
            </Link>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white shadow-2xl sm:p-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative z-10">
              <div className="mb-6 flex items-center gap-3 sm:mb-8">
                <span className="material-symbols-outlined text-blue-400 text-2xl">
                  ios_share
                </span>
                <h2 className="font-staff-headline text-xl font-bold">Exports</h2>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-slate-300 sm:mb-8">
                Filter by date range on Submissions, then download CSV or Excel. Exports use
                the same scope as your role (your halqa and gender for Incharge/Secretary; all
                halqas for Admin).
              </p>
              <Link
                href="/dashboard/submissions"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-100"
              >
                Open submissions &amp; export
                <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
