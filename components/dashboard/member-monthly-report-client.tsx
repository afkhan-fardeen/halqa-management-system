"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
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
import { cn } from "@/lib/utils";
import { upsertMemberMonthlyStaffNote } from "@/lib/actions/member-monthly-notes";
import type { MemberMonthlyReportData } from "@/lib/queries/member-monthly-report";
import {
  prayerPieFromRows,
  prayerRowsForGender,
} from "@/lib/utils/monthly-report-prayer-display";
import { Button } from "@/components/ui/button";

type Counterpart = { name: string; roleLabel: "Secretary" | "Incharge" } | null;

type PickerRow = { id: string; name: string; email: string };

const LINE_STROKE = "#0053db";

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

export function MemberMonthlyReportClient({
  role,
  counterpart,
  picker,
  report,
  month,
  memberId,
  error,
}: {
  role: StaffRole;
  counterpart: Counterpart;
  picker: PickerRow[];
  report: MemberMonthlyReportData | null;
  month: string;
  memberId: string;
  error: string | null;
}) {
  const router = useRouter();

  const lineData = useMemo(() => {
    if (!report) return [];
    return report.dailySeries.map((d) => ({
      day: d.ymd.slice(8).replace(/^0/, ""),
      quran: d.quranPages,
    }));
  }, [report]);

  const prayerRows = useMemo(() => {
    if (!report) return [];
    return prayerRowsForGender(
      report.summary.prayerByStatus,
      report.member.genderUnit,
    );
  }, [report]);

  const prayerPieData = useMemo(
    () => prayerPieFromRows(prayerRows),
    [prayerRows],
  );

  const isEmptyMonth = Boolean(
    report &&
      report.summary.daysWithLog === 0 &&
      report.contactRows.length === 0,
  );

  function navigate(next: { month?: string; memberId?: string }) {
    const q = new URLSearchParams();
    const m = next.month ?? month;
    const mid = next.memberId ?? memberId;
    if (m) q.set("month", m);
    if (mid) q.set("memberId", mid);
    router.push(`/dashboard/reports/monthly?${q.toString()}`);
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-staff-headline text-3xl font-extrabold leading-tight tracking-tight text-staff-on-surface sm:text-[2.2rem] md:text-[2.75rem]">
            Monthly member report
          </h1>
          <p className="mt-2 max-w-2xl text-staff-on-surface-variant">
            {role === "ADMIN"
              ? "All halqas — pick an active member and month."
              : "Your halqa — pick an active member and month."}
          </p>
          {counterpart ? (
            <p className="mt-2 text-sm font-medium text-staff-on-surface-variant">
              {counterpart.roleLabel}: {counterpart.name}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-xl bg-staff-surface-container-low px-4 py-2">
            <span className="material-symbols-outlined text-staff-primary text-[22px]">
              calendar_month
            </span>
            <span className="font-semibold text-staff-on-surface">
              {formatMonthHeading(month || currentMonthYyyyMm())}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-staff-outline-variant/10 bg-staff-surface-container-lowest p-6 shadow-sm md:p-8">
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
          Choose a member to load prayer, Quran, contacts, and Aiyanat for the selected month.
        </p>
      ) : null}

      {report ? (
        <>
          {isEmptyMonth ? (
            <div
              className="rounded-xl border border-staff-outline-variant/20 bg-staff-surface-container-low/80 px-5 py-4 shadow-sm"
              role="status"
            >
              <h2 className="font-staff-headline text-lg font-bold text-staff-on-surface">
                No data for this month
              </h2>
              <p className="mt-1 text-sm text-staff-on-surface-variant">
                No daily logs or contacts were recorded for this member in{" "}
                {formatMonthHeading(month || currentMonthYyyyMm())}. You can still add a staff note
                below.
              </p>
            </div>
          ) : null}

          <MemberStaffNoteCard
            memberId={memberId}
            month={month}
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
                <p className="mt-1 text-sm text-staff-on-surface-variant">
                  {report.member.email}
                </p>
                <p className="mt-2 text-sm text-staff-on-surface-variant">
                  {report.member.halqa.replaceAll("_", " ")} · {report.member.genderUnit}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href={buildExportHref(memberId, month, "csv")}
                  className="flex flex-col items-center justify-center rounded-xl bg-staff-surface-container-lowest p-6 shadow-sm transition-all hover:bg-staff-surface-container-high"
                >
                  <span className="material-symbols-outlined mb-2 text-staff-primary text-2xl">
                    share
                  </span>
                  <span className="text-xs font-bold text-staff-on-surface">Export CSV</span>
                </Link>
                <Link
                  href={buildExportHref(memberId, month, "xlsx")}
                  className="flex flex-col items-center justify-center rounded-xl bg-staff-surface-container-lowest p-6 shadow-sm transition-all hover:bg-staff-surface-container-high"
                >
                  <span className="material-symbols-outlined mb-2 text-staff-primary text-2xl">
                    table_chart
                  </span>
                  <span className="text-xs font-bold text-staff-on-surface">Export Excel</span>
                </Link>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <div className="rounded-xl bg-staff-surface-container-low/50 p-6 md:p-8">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-staff-headline text-2xl font-bold text-staff-on-surface">
                    Month totals
                  </h2>
                  <span className="rounded-full bg-staff-surface-container-lowest px-3 py-1 text-sm font-medium text-staff-on-surface-variant">
                    {report.summary.daysInMonth} days in month
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <MetricTile
                    icon="history_edu"
                    iconBg="bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
                    label="Days with log"
                    value={`${report.summary.daysWithLog} / ${report.summary.daysInMonth}`}
                  />
                  {prayerRows.map((row) => (
                    <MetricTile
                      key={row.key}
                      icon={row.icon}
                      iconBg={row.iconBg}
                      label={row.label}
                      value={String(row.value)}
                      highlight={row.key === "QAZA"}
                    />
                  ))}
                  <MetricTile
                    icon="auto_stories"
                    iconBg="bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"
                    label="Quran pages (total)"
                    value={String(report.summary.totalQuranPages)}
                  />
                  <MetricTile
                    icon="menu_book"
                    iconBg="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"
                    label="Days with Quran logged"
                    value={String(report.summary.daysWithQuranSaved)}
                  />
                  <MetricTile
                    icon="thumb_up"
                    iconBg="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    label="Hadith — yes (days)"
                    value={String(report.summary.daysHadithYes)}
                  />
                  <MetricTile
                    icon="thumb_down"
                    iconBg="bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"
                    label="Hadith — no (days)"
                    value={String(report.summary.daysHadithNo)}
                  />
                  <MetricTile
                    icon="library_books"
                    iconBg="bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
                    label="Literature — with book (days)"
                    value={String(report.summary.daysLiteratureWithBook)}
                  />
                  <MetricTile
                    icon="book_2"
                    iconBg="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    label="Literature — skipped (days)"
                    value={String(report.summary.daysLiteratureSkipped)}
                  />
                  <MetricTile
                    icon="contacts"
                    iconBg="bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
                    label="Contacts"
                    value={String(report.summary.totalContacts)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-staff-outline-variant/10 bg-staff-surface-container-lowest p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="font-staff-headline text-lg font-bold text-staff-on-surface">
                  Quran pages by day
                </h3>
                <p className="text-sm text-staff-on-surface-variant">
                  Daily total pages for this month.
                </p>
              </div>
              <div className="flex h-[300px] w-full min-w-0 flex-col">
                <div className="min-h-[220px] min-w-0 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-staff-outline-variant/30" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="quran"
                        name="Quran pages"
                        stroke={LINE_STROKE}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-staff-outline-variant/10 bg-staff-surface-container-lowest p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="font-staff-headline text-lg font-bold text-staff-on-surface">
                  Prayer status mix
                </h3>
                <p className="text-sm text-staff-on-surface-variant">
                  Counts across saved salat for the month.
                </p>
              </div>
              <div className="flex h-[300px] flex-col">
                {prayerPieData.length === 0 ? (
                  <p className="text-sm text-staff-on-surface-variant">No saved salat data this month.</p>
                ) : (
                  <div className="min-h-[220px] min-w-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={prayerPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={88}
                          label={({ name, percent }) =>
                            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                        >
                          {prayerPieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill ?? "#64748b"} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => [typeof v === "number" ? v : Number(v), "Prayers"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-staff-outline-variant/10 bg-staff-surface-container-lowest p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="font-staff-headline text-lg font-bold text-staff-on-surface">
                Aiyanat ({report.month})
              </h3>
              <p className="text-sm text-staff-on-surface-variant">Payment for this calendar month.</p>
            </div>
            {report.aiyanat ? (
              <ul className="space-y-2 text-sm text-staff-on-surface">
                <li>
                  <span className="text-staff-on-surface-variant">Status: </span>
                  {report.aiyanat.status === "PAID" ? "Paid" : "Not paid"}
                </li>
                <li>
                  <span className="text-staff-on-surface-variant">Amount: </span>
                  {report.aiyanat.amount}
                </li>
                {report.aiyanat.paymentDate ? (
                  <li>
                    <span className="text-staff-on-surface-variant">Payment date: </span>
                    {report.aiyanat.paymentDate}
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="text-sm text-staff-on-surface-variant">No Aiyanat row for this month.</p>
            )}
          </div>

          <div className="rounded-xl border border-staff-outline-variant/10 bg-staff-surface-container-lowest p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="font-staff-headline text-lg font-bold text-staff-on-surface">
                Contacts this month
              </h3>
              <p className="text-sm text-staff-on-surface-variant">
                All contacts logged in the selected month.
              </p>
            </div>
            {report.contactRows.length === 0 ? (
              <p className="text-sm text-staff-on-surface-variant">No contacts this month.</p>
            ) : (
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
                    {report.contactRows.map((c) => (
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
            )}
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
  body: initialBody,
  updatedAtIso,
  updatedByName,
}: {
  memberId: string;
  month: string;
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
        <h2 className="font-staff-headline text-lg font-bold text-staff-on-surface">Staff note</h2>
        <p className="mt-1 text-sm text-staff-on-surface-variant">
          Private note for this member and month. Visible to staff in scope.
        </p>
      </div>
      <textarea
        className="min-h-[120px] w-full resize-y rounded-lg border-0 bg-staff-surface-container-low px-3 py-2 text-sm text-staff-on-surface placeholder:text-staff-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-staff-primary/25"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add context for this month…"
        aria-label="Staff note for this month"
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

function MetricTile({
  icon,
  iconBg,
  label,
  value,
  highlight,
}: {
  icon: string;
  iconBg: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-staff-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md",
        highlight && "border-l-4 border-red-200 dark:border-red-900/50",
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            iconBg,
          )}
        >
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
      </div>
      <div className="font-staff-headline mb-1 text-3xl font-black text-staff-on-surface sm:text-4xl">
        {value}
      </div>
      <div className="text-xs font-bold uppercase tracking-wider text-staff-on-surface-variant">
        {label}
      </div>
    </div>
  );
}
