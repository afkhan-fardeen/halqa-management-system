"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StaffPageHeader } from "@/components/dashboard/staff-page-section";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StaffRole } from "@/lib/auth/roles";
import type { MemberMonthlyReportData } from "@/lib/queries/member-monthly-report";
import { cn } from "@/lib/utils";
import { prayerRowsForGender } from "@/lib/utils/monthly-report-prayer-display";

type Counterpart = { name: string; roleLabel: "Secretary" | "Incharge" } | null;

type PickerRow = { id: string; name: string; email: string };

function currentMonthYyyyMm(): string {
  return new Date().toISOString().slice(0, 7);
}

function formatMonthHeading(yyyyMm: string): string {
  if (!/^\d{4}-\d{2}$/.test(yyyyMm)) return yyyyMm;
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });
}

function buildReportHref(opts: {
  month: string;
  memberId: string;
  contactsPage?: number;
}) {
  const q = new URLSearchParams();
  q.set("month", opts.month);
  q.set("memberId", opts.memberId);
  if (opts.contactsPage && opts.contactsPage > 1) {
    q.set("cpage", String(opts.contactsPage));
  }
  return `/dashboard/reports/monthly?${q.toString()}`;
}

export function MemberMonthlyReportClient({
  role,
  counterpart,
  picker,
  report,
  month,
  memberId,
  contactsPage,
  error,
}: {
  role: StaffRole;
  counterpart: Counterpart;
  picker: PickerRow[];
  report: MemberMonthlyReportData | null;
  month: string;
  memberId: string;
  contactsPage: number;
  error: string | null;
}) {
  const router = useRouter();

  const prayerRows = useMemo(() => {
    if (!report) return [];
    return prayerRowsForGender(
      report.summary.prayerByStatus,
      report.member.genderUnit,
    );
  }, [report]);

  const hasMonthScopedActivity = Boolean(
    report &&
      (report.summary.daysWithLog > 0 ||
        report.summary.contactsLoggedInReportMonth > 0 ||
        report.aiyanatHistory.some((r) => r.month === report.month)),
  );

  const isSparseMonth = Boolean(report && !hasMonthScopedActivity);

  const contactTotalPages = report
    ? Math.max(1, Math.ceil(report.contacts.total / report.contacts.pageSize))
    : 1;

  function navigate(next: { month?: string; memberId?: string }) {
    const m = next.month ?? month;
    const mid = next.memberId ?? memberId;
    router.push(buildReportHref({ month: m, memberId: mid }));
  }

  function navigateContactsPage(page: number) {
    router.push(
      buildReportHref({
        month,
        memberId,
        contactsPage: Math.max(1, page),
      }),
    );
  }

  const monthLabel = formatMonthHeading(month || currentMonthYyyyMm());

  return (
    <div className="space-y-8 md:space-y-10">
      <StaffPageHeader
        title="Monthly member report"
        titleClassName="text-3xl font-extrabold leading-tight sm:text-[2.2rem] md:text-[2.75rem]"
        description={
          <p className="text-sm text-staff-on-surface-variant">
            {role === "ADMIN"
              ? "Pick a member and month. Worship totals use that month; contacts and Aiyanat are full history."
              : "Pick a member and month. Worship totals use that month; contacts and Aiyanat are full history."}
            {counterpart ? (
              <span className="mt-1 block text-xs">
                {counterpart.roleLabel}: {counterpart.name}
              </span>
            ) : null}
          </p>
        }
      />

      <div className="staff-elevated-surface rounded-2xl bg-staff-surface-container-lowest p-6 md:p-8 dark:bg-slate-900">
        <label className="mb-4 block text-[0.6875rem] font-bold uppercase tracking-wider text-staff-on-surface-variant/80">
          Month &amp; member
        </label>
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="grid min-w-[160px] gap-1">
            <label className="text-xs text-staff-on-surface-variant" htmlFor="month">
              Month ({monthLabel})
            </label>
            <input
              id="month"
              type="month"
              className="h-10 rounded-lg border-0 bg-staff-surface-container-low px-3 text-sm text-staff-on-surface focus:outline-none focus:ring-2 focus:ring-staff-primary/25"
              value={month || currentMonthYyyyMm()}
              onChange={(e) => navigate({ month: e.target.value })}
            />
          </div>
          <div className="grid min-w-[220px] flex-1 gap-1">
            <label className="text-xs text-staff-on-surface-variant" htmlFor="member">
              Member
            </label>
            <select
              id="member"
              className="h-10 rounded-lg border-0 bg-staff-surface-container-low px-3 text-sm text-staff-on-surface focus:outline-none focus:ring-2 focus:ring-staff-primary/25"
              value={memberId}
              onChange={(e) => navigate({ memberId: e.target.value })}
            >
              <option value="">Select a member…</option>
              {picker.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {!memberId ? (
        <p className="text-sm text-staff-on-surface-variant">
          Choose a member to load worship totals for the month and full contact / Aiyanat history.
        </p>
      ) : null}

      {report ? (
        <>
          {isSparseMonth ? (
            <div
              className="rounded-xl border border-staff-outline-variant/20 bg-staff-surface-container-low/80 px-5 py-4 shadow-sm"
              role="status"
            >
              <h2 className="font-staff-headline text-lg font-bold text-staff-on-surface">
                Light activity this month
              </h2>
              <p className="mt-1 text-sm text-staff-on-surface-variant">
                No daily logs or in-month contacts for {monthLabel}, and no Aiyanat row for that
                month. Expand sections below for full history.
              </p>
            </div>
          ) : null}

          <p className="text-center text-xs text-staff-on-surface-variant">
            {report.summary.daysWithLog}/{report.summary.daysInMonth} days with log ·{" "}
            {report.summary.contactsLoggedInReportMonth} contacts logged in {monthLabel}
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-staff-outline-variant/15 bg-staff-surface-container-lowest p-5 shadow-sm dark:bg-slate-900">
              <h3 className="font-staff-headline text-sm font-bold text-staff-on-surface">
                Prayers
              </h3>
              <p className="mt-1 text-[11px] text-staff-on-surface-variant">
                Saved salat in {monthLabel}
              </p>
              <ul className="mt-4 space-y-2">
                {prayerRows.map((row) => (
                  <li
                    key={row.key}
                    className={cn(
                      "flex items-center justify-between rounded-lg border border-staff-outline-variant/15 px-3 py-2 text-sm",
                      row.key === "QAZA" && "border-l-4 border-red-200 dark:border-red-900/50",
                    )}
                  >
                    <span className="text-staff-on-surface-variant">{row.label}</span>
                    <span className="font-bold tabular-nums text-staff-on-surface">
                      {row.value}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-staff-on-surface-variant">
                Qaza (prayer-day count):{" "}
                <span className="font-semibold text-staff-on-surface">
                  {report.summary.totalQazaPrayers}
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-staff-outline-variant/15 bg-staff-surface-container-lowest p-5 shadow-sm dark:bg-slate-900">
              <h3 className="font-staff-headline text-sm font-bold text-staff-on-surface">
                Quran
              </h3>
              <p className="mt-1 text-[11px] text-staff-on-surface-variant">Month totals</p>
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-staff-on-surface-variant">
                    Pages
                  </dt>
                  <dd className="font-staff-headline text-2xl font-bold tabular-nums text-staff-on-surface">
                    {report.summary.totalQuranPages}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-staff-on-surface-variant">
                    Days with Quran saved
                  </dt>
                  <dd className="text-xl font-bold tabular-nums text-staff-on-surface">
                    {report.summary.daysWithQuranSaved}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ["Tilawat", report.summary.quranByType.TILAWAT],
                    ["Tafseer", report.summary.quranByType.TAFSEER],
                    ["Both", report.summary.quranByType.BOTH],
                  ] as const
                ).map(([label, n]) => (
                  <span
                    key={label}
                    className="rounded-full bg-staff-primary-container px-2.5 py-1 text-[11px] font-semibold text-staff-on-primary-container dark:bg-teal-950/40 dark:text-teal-200"
                  >
                    {label}: {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-staff-outline-variant/15 bg-staff-surface-container-lowest p-5 shadow-sm dark:bg-slate-900">
              <h3 className="font-staff-headline text-sm font-bold text-staff-on-surface">
                Hadith &amp; literature
              </h3>
              <p className="mt-1 text-[11px] text-staff-on-surface-variant">
                Days hadith section was saved
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-2 rounded-lg bg-staff-surface-container-low/60 px-3 py-2 dark:bg-slate-800/50">
                  <dt className="text-staff-on-surface-variant">Hadith yes / no</dt>
                  <dd className="font-bold tabular-nums text-staff-on-surface">
                    {report.summary.daysHadithYes} / {report.summary.daysHadithNo}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 rounded-lg bg-staff-surface-container-low/60 px-3 py-2 dark:bg-slate-800/50">
                  <dt className="text-staff-on-surface-variant">Literature yes / no</dt>
                  <dd className="font-bold tabular-nums text-staff-on-surface">
                    {report.summary.daysLiteratureYes} / {report.summary.daysLiteratureNo}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="staff-elevated-surface rounded-2xl border border-staff-outline-variant/15 bg-staff-surface-container-lowest p-2 dark:bg-slate-900">
            <Accordion multiple defaultValue={["contacts", "aiyanat"]}>
              <AccordionItem value="contacts" className="border-b border-staff-outline-variant/15 px-3">
                <AccordionTrigger className="py-3 text-staff-on-surface hover:no-underline">
                  <span className="flex flex-col items-start gap-0.5 text-left sm:flex-row sm:items-baseline sm:gap-2">
                    <span className="font-staff-headline text-base font-bold">
                      Contacts (all time)
                    </span>
                    <span className="text-xs font-normal text-staff-on-surface-variant">
                      {report.contacts.total} total · M {report.contactByStatusAllTime.MUSLIM} · NM{" "}
                      {report.contactByStatusAllTime.NON_MUSLIM}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  {report.contacts.rows.length === 0 ? (
                    <p className="text-sm text-staff-on-surface-variant">No contacts yet.</p>
                  ) : (
                    <>
                      <div className="max-h-[min(28rem,70vh)] w-full overflow-auto rounded-md border border-staff-outline-variant/15">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Log date</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {report.contacts.rows.map((c) => (
                              <TableRow key={c.id}>
                                <TableCell>{c.logDate}</TableCell>
                                <TableCell>{c.name}</TableCell>
                                <TableCell>{c.phone}</TableCell>
                                <TableCell>{c.location}</TableCell>
                                <TableCell>{c.status}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {contactTotalPages > 1 ? (
                        <div className="mt-4 flex items-center justify-between text-sm text-staff-on-surface-variant">
                          <button
                            type="button"
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "sm" }),
                              contactsPage <= 1 && "pointer-events-none opacity-40",
                            )}
                            onClick={() => navigateContactsPage(contactsPage - 1)}
                          >
                            Previous
                          </button>
                          <span>
                            Page {contactsPage} / {contactTotalPages}
                          </span>
                          <button
                            type="button"
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "sm" }),
                              contactsPage >= contactTotalPages &&
                                "pointer-events-none opacity-40",
                            )}
                            onClick={() => navigateContactsPage(contactsPage + 1)}
                          >
                            Next
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="aiyanat" className="px-3">
                <AccordionTrigger className="py-3 text-staff-on-surface hover:no-underline">
                  <span className="flex flex-col items-start gap-0.5 text-left sm:flex-row sm:items-baseline sm:gap-2">
                    <span className="font-staff-headline text-base font-bold">Aiyanat history</span>
                    <span className="text-xs font-normal text-staff-on-surface-variant">
                      Newest first · report month highlighted
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  {report.aiyanatHistory.length === 0 ? (
                    <p className="text-sm text-staff-on-surface-variant">No Aiyanat rows yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-staff-outline-variant/15">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Payment date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.aiyanatHistory.map((row) => {
                            const active = row.month === report.month;
                            return (
                              <TableRow
                                key={row.month}
                                className={cn(
                                  active &&
                                    "bg-staff-primary-container/35 dark:bg-teal-950/35",
                                )}
                              >
                                <TableCell className="font-medium">{row.month}</TableCell>
                                <TableCell>
                                  {row.status === "PAID" ? "Paid" : "Not paid"}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {row.amount}
                                </TableCell>
                                <TableCell>{row.paymentDate ?? "—"}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </>
      ) : null}
    </div>
  );
}
