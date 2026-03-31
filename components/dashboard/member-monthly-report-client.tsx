"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { MemberMonthlyReportData } from "@/lib/queries/member-monthly-report";

type Counterpart = { name: string; roleLabel: "Secretary" | "Incharge" } | null;

type PickerRow = { id: string; name: string; email: string };

const PRAYER_PIE_COLORS: Record<string, string> = {
  "Ba jamaat": "#059669",
  Munfarid: "#2563eb",
  Qaza: "#dc2626",
  "On time": "#d97706",
};

function currentMonthYyyyMm(): string {
  return new Date().toISOString().slice(0, 7);
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
  const themeClass =
    role === "SECRETARY"
      ? "border-teal-600/40 bg-teal-50/40 dark:border-teal-700/50 dark:bg-teal-950/25"
      : role === "ADMIN"
        ? "border-slate-500/30 bg-slate-50/50 dark:border-slate-600/40 dark:bg-slate-950/30"
        : "border-blue-700/35 bg-blue-50/40 dark:border-blue-600/45 dark:bg-blue-950/25";

  const accentLine =
    role === "SECRETARY"
      ? "#0d9488"
      : role === "ADMIN"
        ? "#64748b"
        : "#1565c0";

  const lineData = useMemo(() => {
    if (!report) return [];
    return report.dailySeries.map((d) => ({
      day: d.ymd.slice(8).replace(/^0/, ""),
      quran: d.quranPages,
    }));
  }, [report]);

  const prayerPieData = useMemo(() => {
    if (!report) return [];
    const p = report.summary.prayerByStatus;
    return [
      { name: "Ba jamaat", value: p.BA_JAMAAT },
      { name: "Munfarid", value: p.MUNFARID },
      { name: "Qaza", value: p.QAZA },
      { name: "On time", value: p.ON_TIME },
    ].filter((x) => x.value > 0);
  }, [report]);

  function navigate(next: { month?: string; memberId?: string }) {
    const q = new URLSearchParams();
    const m = next.month ?? month;
    const mid = next.memberId ?? memberId;
    if (m) q.set("month", m);
    if (mid) q.set("memberId", mid);
    router.push(`/dashboard/reports/monthly?${q.toString()}`);
  }

  return (
    <div className={cn("space-y-6 rounded-xl border p-4 md:p-6", themeClass)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Monthly member report
          </h1>
          <p className="text-muted-foreground text-sm">
            {role === "ADMIN"
              ? "All halqas — pick an active member and month."
              : "Your halqa — pick an active member and month."}
          </p>
          {counterpart ? (
            <p className="text-muted-foreground mt-2 text-sm font-medium">
              {counterpart.roleLabel}: {counterpart.name}
            </p>
          ) : null}
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Selection</CardTitle>
          <CardDescription>Month, member, and exports.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="grid gap-1">
            <label className="text-muted-foreground text-xs" htmlFor="month">
              Month
            </label>
            <input
              id="month"
              type="month"
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              value={month || currentMonthYyyyMm()}
              onChange={(e) => navigate({ month: e.target.value })}
            />
          </div>
          <div className="grid min-w-[220px] flex-1 gap-1">
            <label className="text-muted-foreground text-xs" htmlFor="member">
              Member
            </label>
            <select
              id="member"
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
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
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Export CSV
              </Link>
              <Link
                href={buildExportHref(memberId, month, "xlsx")}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Export Excel
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {error ? (
        <p className="text-destructive text-sm font-medium" role="alert">
          {error}
        </p>
      ) : null}

      {!memberId ? (
        <p className="text-muted-foreground text-sm">
          Choose a member to load prayer, Quran, outreach, and Aiyanat for the
          selected month.
        </p>
      ) : null}

      {report ? (
        <>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{report.member.name}</CardTitle>
              <CardDescription>
                {report.member.email} · {report.member.halqa.replaceAll("_", " ")} ·{" "}
                {report.member.genderUnit}
              </CardDescription>
            </CardHeader>
          </Card>

          <div>
            <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
              Month totals
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Kpi
                title="Days with log"
                value={`${report.summary.daysWithLog} / ${report.summary.daysInMonth}`}
              />
              <Kpi
                title="Ba jamaat (total)"
                value={String(report.summary.prayerByStatus.BA_JAMAAT)}
              />
              <Kpi
                title="Munfarid (total)"
                value={String(report.summary.prayerByStatus.MUNFARID)}
              />
              <Kpi
                title="Qaza (total)"
                value={String(report.summary.prayerByStatus.QAZA)}
              />
              <Kpi
                title="On time (total)"
                value={String(report.summary.prayerByStatus.ON_TIME)}
              />
              <Kpi
                title="Quran pages (total)"
                value={String(report.summary.totalQuranPages)}
              />
              <Kpi
                title="Days with Quran logged"
                value={String(report.summary.daysWithQuranSaved)}
              />
              <Kpi
                title="Hadith — yes (days)"
                value={String(report.summary.daysHadithYes)}
              />
              <Kpi
                title="Hadith — no (days)"
                value={String(report.summary.daysHadithNo)}
              />
              <Kpi
                title="Literature — with book (days)"
                value={String(report.summary.daysLiteratureWithBook)}
              />
              <Kpi
                title="Literature — skipped (days)"
                value={String(report.summary.daysLiteratureSkipped)}
              />
              <Kpi
                title="Outreach contacts"
                value={String(report.summary.totalContacts)}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quran pages by day</CardTitle>
                <CardDescription>Daily total pages for this month.</CardDescription>
              </CardHeader>
              <CardContent className="flex h-[300px] w-full min-w-0 flex-col p-6 pt-0">
                <div className="min-h-[220px] min-w-0 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="quran"
                        name="Quran pages"
                        stroke={accentLine}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Prayer status mix</CardTitle>
                <CardDescription>Counts across saved salat for the month.</CardDescription>
              </CardHeader>
              <CardContent className="flex h-[300px] flex-col p-6 pt-0">
                {prayerPieData.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No saved salat data this month.</p>
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
                            <Cell key={entry.name} fill={PRAYER_PIE_COLORS[entry.name] ?? "#64748b"} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => [typeof v === "number" ? v : Number(v), "Prayers"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Aiyanat ({report.month})</CardTitle>
              <CardDescription>Payment for this calendar month.</CardDescription>
            </CardHeader>
            <CardContent>
              {report.aiyanat ? (
                <ul className="space-y-2 text-sm">
                  <li>
                    <span className="text-muted-foreground">Status: </span>
                    {report.aiyanat.status === "PAID" ? "Paid" : "Not paid"}
                  </li>
                  <li>
                    <span className="text-muted-foreground">Amount: </span>
                    {report.aiyanat.amount}
                  </li>
                  {report.aiyanat.paymentDate ? (
                    <li>
                      <span className="text-muted-foreground">Payment date: </span>
                      {report.aiyanat.paymentDate}
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No Aiyanat row for this month.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Contacts this month</CardTitle>
              <CardDescription>All outreach contacts logged in the selected month.</CardDescription>
            </CardHeader>
            <CardContent>
              {report.contactRows.length === 0 ? (
                <p className="text-muted-foreground text-sm">No contacts this month.</p>
              ) : (
                <div className="max-h-[min(28rem,70vh)] w-full overflow-auto rounded-md border">
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
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1 pb-2 pt-4">
        <CardDescription className="text-xs leading-tight">{title}</CardDescription>
        <CardTitle className="text-xl font-semibold tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
