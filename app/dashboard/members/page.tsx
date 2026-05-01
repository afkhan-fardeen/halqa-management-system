import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "@/auth";
import { MemberDirectoryRowActions } from "@/components/dashboard/member-directory-row-actions";
import {
  StaffMetricCard,
  StaffPageHeader,
} from "@/components/dashboard/staff-page-section";
import {
  getMemberDirectoryKpis,
  listMembersForStaff,
} from "@/lib/queries/members-directory";
import { Button } from "@/components/ui/button";
import { isStaffRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

const PAGE_SIZE = 25;

function currentMonthYyyyMm() {
  return new Date().toISOString().slice(0, 7);
}

function formatNumber(n: number) {
  return n.toLocaleString();
}

export default async function DashboardMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect("/login");
  }

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const [kpis, { rows, total }] = await Promise.all([
    getMemberDirectoryKpis({ q: sp.q }),
    listMembersForStaff({
      q: sp.q,
      status: sp.status,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  if (total > 0 && page > totalPages) {
    redirect(
      `/dashboard/members?${new URLSearchParams({
        ...(sp.q ? { q: sp.q } : {}),
        ...(sp.status ? { status: sp.status } : {}),
        page: String(totalPages),
      }).toString()}`,
    );
  }

  const q = new URLSearchParams();
  if (sp.q) q.set("q", sp.q);
  if (sp.status) q.set("status", sp.status);

  const exportMembersHref = `/api/export/members?${q.toString()}`;
  const startIdx = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, total);

  return (
    <div className="space-y-8 md:space-y-10">
      <StaffPageHeader
        title="Member directory"
        description="Search by name or email. Scoped to your halqa and gender unless you are admin."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
        <StaffMetricCard
          label="Total members"
          value={formatNumber(kpis.total)}
          valueClassName="!text-3xl !font-bold"
        />
        <StaffMetricCard
          label="Active"
          value={formatNumber(kpis.active)}
          valueClassName="!text-3xl !font-bold text-emerald-600 dark:text-emerald-400"
        />
        <StaffMetricCard
          label="Pending"
          value={formatNumber(kpis.pending)}
          valueClassName={cn(
            "!text-3xl !font-bold",
            kpis.pending > 0 && "text-amber-600 dark:text-amber-400",
          )}
        />
        <StaffMetricCard
          label="Deactivated"
          value={formatNumber(kpis.deactivated)}
          valueClassName="!text-3xl !font-bold"
        />
      </div>

      <div className="staff-elevated-surface overflow-hidden rounded-2xl bg-staff-surface-container-lowest dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-staff-outline-variant/10 p-6 md:flex-row md:items-center md:justify-between">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
            method="get"
            action="/dashboard/members"
          >
            <div className="grid gap-1">
              <label
                className="text-[0.65rem] font-bold uppercase tracking-wider text-staff-on-surface-variant"
                htmlFor="q"
              >
                Search
              </label>
              <input
                id="q"
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="Name or email"
                className="h-10 min-w-[200px] rounded-lg border-0 bg-staff-surface-container-low px-3 text-sm text-staff-on-surface placeholder:text-staff-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-staff-primary/25"
              />
            </div>
            <div className="grid gap-1">
              <label
                className="text-[0.65rem] font-bold uppercase tracking-wider text-staff-on-surface-variant"
                htmlFor="status"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={sp.status ?? ""}
                className="h-10 rounded-lg border-0 bg-staff-surface-container-low px-3 text-sm text-staff-on-surface focus:outline-none focus:ring-2 focus:ring-staff-primary/25"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="REJECTED">Rejected</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>
            <input type="hidden" name="page" value="1" />
            <Button
              type="submit"
              size="sm"
              className="h-10 rounded-lg bg-staff-primary px-4 font-bold text-white shadow-sm hover:opacity-90"
            >
              Apply
            </Button>
          </form>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={exportMembersHref}
              className="rounded-lg px-4 py-2 text-sm font-bold text-staff-on-surface transition-colors hover:bg-staff-surface-container"
            >
              Export CSV
            </Link>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="p-8 text-sm text-staff-on-surface-variant">No members found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-staff-surface-container-low/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-staff-on-surface-variant">
                      Member
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-staff-on-surface-variant">
                      Halqa / unit
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-staff-on-surface-variant">
                      Status
                    </th>
                    <th className="hidden px-6 py-4 text-xs font-bold uppercase tracking-wider text-staff-on-surface-variant md:table-cell">
                      Email
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-staff-on-surface-variant">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-staff-outline-variant/10">
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="group hover:bg-staff-surface-container-low/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-staff-on-surface">
                            {r.name}
                          </span>
                          <span className="text-xs text-staff-on-surface-variant md:hidden">
                            {r.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-staff-on-surface-variant">
                        {r.halqa.replaceAll("_", " ")} · {r.genderUnit}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={r.status} />
                      </td>
                      <td className="hidden px-6 py-4 text-sm text-staff-on-surface-variant md:table-cell">
                        {r.email}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <MemberDirectoryRowActions
                          memberId={r.id}
                          monthYyyyMm={currentMonthYyyyMm()}
                          isDeactivated={r.status === "DEACTIVATED"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="flex flex-col gap-3 border-t border-staff-outline-variant/10 bg-staff-surface-container-low/20 p-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-staff-on-surface-variant">
                  Showing{" "}
                  <span className="font-bold text-staff-on-surface">
                    {formatNumber(startIdx)}–{formatNumber(endIdx)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-staff-on-surface">
                    {formatNumber(total)}
                  </span>{" "}
                  members
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/members?${new URLSearchParams({
                      ...(sp.q ? { q: sp.q } : {}),
                      ...(sp.status ? { status: sp.status } : {}),
                      page: String(safePage - 1),
                    }).toString()}`}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-staff-outline-variant/20 text-staff-on-surface-variant transition-colors hover:bg-staff-surface-container",
                      safePage <= 1 && "pointer-events-none opacity-40",
                    )}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                  </Link>
                  <span className="px-2 text-xs font-bold text-staff-on-surface">
                    {safePage} / {totalPages}
                  </span>
                  <Link
                    href={`/dashboard/members?${new URLSearchParams({
                      ...(sp.q ? { q: sp.q } : {}),
                      ...(sp.status ? { status: sp.status } : {}),
                      page: String(safePage + 1),
                    }).toString()}`}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-staff-outline-variant/20 text-staff-on-surface-variant transition-colors hover:bg-staff-surface-container",
                      safePage >= totalPages && "pointer-events-none opacity-40",
                    )}
                    aria-label="Next page"
                  >
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE:
      "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    PENDING:
      "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    REJECTED: "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200",
    DEACTIVATED:
      "bg-staff-surface-container-high text-staff-on-surface-variant",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[status] ?? "bg-staff-tertiary-container text-staff-on-tertiary-container",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          status === "ACTIVE" && "bg-emerald-500",
          status === "PENDING" && "bg-amber-500",
          status === "REJECTED" && "bg-red-500",
          status === "DEACTIVATED" && "bg-staff-outline-variant",
        )}
      />
      {status}
    </span>
  );
}
