"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  FileSpreadsheet,
  Share2,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  StaffPageHeader,
  StaffPanel,
} from "@/components/dashboard/staff-page-section";
import { Button } from "@/components/ui/button";
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
import { upsertMemberMonthlyStaffNote } from "@/lib/actions/member-monthly-notes";
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

function buildExportHref(
  memberId: string,
  month: string,
  format: "csv" | "xlsx",
) {
  const q = new URLSearchParams({ memberId, month, format });
  return `/api/export/member-monthly?${q.toString()}`;
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

  return (
    <div className="space-y-8 md:space-y-10">
      <StaffPageHeader
        title="Monthly member report"
        titleClassName="text-3xl font-extrabold leading-tight sm:text-[2.2rem] md:text-[2.75rem]"
        description={
          <>
            <p>
              {role === "ADMIN"
                ? "All halqas — pick an active member and month."
                : "Your halqa — pick an active member and month."}
            </p>
            <p className="mt-2 text-sm text-staff-on-surface-variant">
              The month applies to daily worship totals (prayer, Quran, hadith &amp; literature)
              and the staff note. Contacts and Aiyanat below show{" "}
              <span className="font-semibold text-staff-on-surface">full history</span> for the
              selected member.
            </p>
            {counterpart ? (
              <p className="mt-2 text-sm font-medium text-staff-on-surface-variant">
                {counterpart.roleLabel}: {counterpart.name}
              </p>
            ) : null}
          </>
        }
        action={
          <div className="flex flex-wrap items-center gap-3 md:items-end">
            <div className="flex items-center gap-3 rounded-xl bg-staff-surface-container-low px-4 py-2 dark:bg-slate-800/80">
              <CalendarDays
                className="size-[22px] shrink-0 text-staff-primary dark:text-teal-300"
                aria-hidden
              />
              <span className="font-semibold text-staff-on-surface dark:text-slate-100">
                {formatMonthHeading(month || currentMonthYyyyMm())}
              </span>
            </div>
          </div>
        }
      />

      <div className="staff-elevated-surface rounded-2xl bg-staff-surface-container-lowest p-6 md:p-8 dark:bg-slate-900">
        <label className="mb-4 block text-[0.6875rem] font-bold uppercase tracking-wider text-staff-on-surface-variant/80">
          Month &amp; member
        </label>
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="grid min-w-[160px] gap-1">
            <label className="text-xs text-staff-on-surface-variant" htmlFor="month">
              Month
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
          {report ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildExportHref(memberId, month, "csv")}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-10 rounded-lg border-staff-outline-variant/30 font-bold",
                )}
              >
                Export CSV
              </Link>
              <Link
                href={buildExportHref(memberId, month, "xlsx")}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-10 rounded-lg border-staff-outline-variant/30 font-bold",
                )}
              >
                Export Excel
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {!memberId ? (
        <p className="text-sm text-staff-on-surface-variant">
          Choose a member to load worship totals for the selected month and full contact / Aiyanat
          history.
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
                No daily logs or in-month contacts for{" "}
                {formatMonthHeading(month || currentMonthYyyyMm())}, and no Aiyanat row for that
                month. Contacts and older Aiyanat may still appear below.
              </p>
            </div>
          ) : null}

          <MemberStaffNoteCard
            memberId={memberId}
            month={month}
            monthLabel={formatMonthHeading(month)}
            body={report.staffNote?.body ?? ""}
            updatedAtIso={report.staffNote?.updatedAt ?? null}
            updatedByName={report.staffNote?.updatedByName ?? null}
          />

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 space-y-6 lg:col-span-4">
              <div className="rounded-xl border border-staff-outline-variant/10 bg-staff-surface-container-lowest p-6 shadow-sm md:p-8">
                <h2 className="font-staff-headline text-lg font-bold text-staff-on-surface">
                  {report.member.name}
                </h2>
                <p className="mt-1 text-sm text-staff-on-surface-variant">{report.member.email}</p>
                <p className="mt-2 text-sm text-staff-on-surface-variant">
                  {report.member.halqa.replaceAll("_", " ")} · {report.member.genderUnit}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href={buildExportHref(memberId, month, "csv")}
                  className="flex flex-col items-center justify-center rounded-xl bg-staff-surface-container-lowest p-6 shadow-sm transition-all hover:bg-staff-surface-container-high"
                >
                  <Share2
                    className="mb-2 size-8 text-staff-primary dark:text-teal-300"
                    aria-hidden
                  />
                  <span className="text-xs font-bold text-staff-on-surface">Export CSV</span>
                </Link>
                <Link
                  href={buildExportHref(memberId, month, "xlsx")}
                  className="flex flex-col items-center justify-center rounded-xl bg-staff-surface-container-lowest p-6 shadow-sm transition-all hover:bg-staff-surface-container-high"
                >
                  <FileSpreadsheet
                    className="mb-2 size-8 text-staff-primary dark:text-teal-300"
                    aria-hidden
                  />
                  <span className="text-xs font-bold text-staff-on-surface">Export Excel</span>
                </Link>
              </div>
            </div>

            <div className="col-span-12 space-y-6 lg:col-span-8">
              <StaffPanel
                title="Month totals"
                description={`${report.summary.daysInMonth} days in month · Worship metrics use logs in ${formatMonthHeading(month)} only.`}
              >
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-staff-surface-container-low/60 px-4 py-3 dark:bg-slate-800/50">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-staff-on-surface-variant">
                      Days with log
                    </dt>
                    <dd className="mt-1 font-staff-headline text-2xl font-bold tabular-nums text-staff-on-surface">
                      {report.summary.daysWithLog}{" "}
                      <span className="text-base font-semibold text-staff-on-surface-variant">
                        / {report.summary.daysInMonth}
                      </span>
                    </dd>
                  </div>
                  <div className="rounded-lg bg-staff-surface-container-low/60 px-4 py-3 dark:bg-slate-800/50">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-staff-on-surface-variant">
                      Contacts logged in this month
                    </dt>
                    <dd className="mt-1 font-staff-headline text-2xl font-bold tabular-nums text-staff-on-surface">
                      {report.summary.contactsLoggedInReportMonth}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 space-y-4">
                  <h3 className="font-staff-headline text-sm font-bold text-staff-on-surface">
                    Prayers (saved salat)
                  </h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {prayerRows.map((row) => (
                      <li
                        key={row.key}
                        className={cn(
                          "flex items-center justify-between rounded-lg border border-staff-outline-variant/15 px-3 py-2 text-sm",
                          row.key === "QAZA" &&
                            "border-l-4 border-red-200 dark:border-red-900/50",
                        )}
                      >
                        <span className="text-staff-on-surface-variant">{row.label}</span>
                        <span className="font-bold tabular-nums text-staff-on-surface">
                          {row.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-staff-on-surface-variant">
                    Qaza (prayer-day count):{" "}
                    <span className="font-semibold text-staff-on-surface">
                      {report.summary.totalQazaPrayers}
                    </span>
                  </p>
                </div>

                <div className="mt-8 border-t border-staff-outline-variant/15 pt-6">
                  <h3 className="font-staff-headline text-sm font-bold text-staff-on-surface">
                    Quran
                  </h3>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-staff-surface-container-low/60 px-4 py-3 dark:bg-slate-800/50">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-staff-on-surface-variant">
                        Pages (month)
                      </dt>
                      <dd className="mt-1 text-xl font-bold tabular-nums text-staff-on-surface">
                        {report.summary.totalQuranPages}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-staff-surface-container-low/60 px-4 py-3 dark:bg-slate-800/50">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-staff-on-surface-variant">
                        Days with Quran saved
                      </dt>
                      <dd className="mt-1 text-xl font-bold tabular-nums text-staff-on-surface">
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
                        className="rounded-full bg-staff-primary-container px-3 py-1 text-xs font-semibold text-staff-on-primary-container dark:bg-teal-950/40 dark:text-teal-200"
                      >
                        {label}: {n}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t border-staff-outline-variant/15 pt-6">
                  <h3 className="font-staff-headline text-sm font-bold text-staff-on-surface">
                    Hadith &amp; literature
                  </h3>
                  <p className="mt-1 text-xs text-staff-on-surface-variant">
                    Days where the hadith section was saved on the daily log.
                  </p>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-staff-surface-container-low/60 px-4 py-3 dark:bg-slate-800/50">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-staff-on-surface-variant">
                        Hadith — yes / no (days)
                      </dt>
                      <dd className="mt-1 text-lg font-bold text-staff-on-surface">
                        {report.summary.daysHadithYes}{" "}
                        <span className="text-staff-on-surface-variant">/</span>{" "}
                        {report.summary.daysHadithNo}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-staff-surface-container-low/60 px-4 py-3 dark:bg-slate-800/50">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-staff-on-surface-variant">
                        Literature — yes / no (days)
                      </dt>
                      <dd className="mt-1 text-lg font-bold text-staff-on-surface">
                        {report.summary.daysLiteratureYes}{" "}
                        <span className="text-staff-on-surface-variant">/</span>{" "}
                        {report.summary.daysLiteratureNo}
                      </dd>
                    </div>
                  </dl>
                </div>
              </StaffPanel>

              <StaffPanel
                title="Contacts (all time)"
                description={`${report.contacts.total} total · Muslim ${report.contactByStatusAllTime.MUSLIM}, non-Muslim ${report.contactByStatusAllTime.NON_MUSLIM}`}
              >
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
              </StaffPanel>

              <StaffPanel
                title="Aiyanat history"
                description="Recent rows for this member (newest first). The report month is highlighted when present."
              >
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
              </StaffPanel>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function formatStaffNoteTimestamp(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function MemberStaffNoteCard({
  memberId,
  month,
  monthLabel,
  body: initialBody,
  updatedAtIso,
  updatedByName,
}: {
  memberId: string;
  month: string;
  monthLabel: string;
  body: string;
  updatedAtIso: string | null;
  updatedByName: string | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    queueMicrotask(() => setBody(initialBody));
  }, [initialBody, memberId, month]);

  return (
    <div className="rounded-xl border border-staff-outline-variant/10 bg-staff-surface-container-lowest p-6 shadow-sm md:p-8">
      <div className="mb-4">
        <h2 className="font-staff-headline text-lg font-bold text-staff-on-surface">
          Staff note for {monthLabel}
        </h2>
        <p className="mt-1 text-sm text-staff-on-surface-variant">
          Private note for this member and calendar month. Visible to staff in scope.
        </p>
      </div>
      <textarea
        className="min-h-[120px] w-full resize-y rounded-lg border-0 bg-staff-surface-container-low px-3 py-2 text-sm text-staff-on-surface placeholder:text-staff-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-staff-primary/25"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add context for this month…"
        aria-label={`Staff note for ${monthLabel}`}
      />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-staff-on-surface-variant">
          {updatedAtIso ? (
            <>
              Last updated {formatStaffNoteTimestamp(updatedAtIso)}
              {updatedByName ? ` · ${updatedByName}` : ""}
            </>
          ) : (
            "Not saved yet."
          )}
        </p>
        <Button
          type="button"
          className="shrink-0 rounded-lg font-bold"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const r = await upsertMemberMonthlyStaffNote(memberId, month, body);
              if (r.ok) {
                toast.success("Staff note saved");
                router.refresh();
              } else {
                toast.error(r.error);
              }
            });
          }}
        >
          {pending ? "Saving…" : "Save note"}
        </Button>
      </div>
    </div>
  );
}
