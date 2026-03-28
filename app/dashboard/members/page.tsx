import Link from "next/link";
import { auth } from "@/auth";
import { adminSendPasswordResetEmail } from "@/lib/actions/password-reset";
import { deactivateMember } from "@/lib/actions/member-admin";
import { listMembersForStaff } from "@/lib/queries/members-directory";
import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
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
import { isStaffRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

const PAGE_SIZE = 25;

function currentMonthYyyyMm() {
  return new Date().toISOString().slice(0, 7);
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
  const { rows, total } = await listMembersForStaff({
    q: sp.q,
    status: sp.status,
    page,
    pageSize: PAGE_SIZE,
  });

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Members
        </h1>
        <Link
          href={exportMembersHref}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
        >
          Export CSV
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Member directory</CardTitle>
          <CardDescription>
            Search by name or email. Scoped to your halqa and gender unless you are admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
            method="get"
            action="/dashboard/members"
          >
            <div className="grid gap-1">
              <label className="text-muted-foreground text-xs" htmlFor="q">
                Search
              </label>
              <input
                id="q"
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="Name or email"
                className="border-input bg-background h-9 min-w-[200px] rounded-md border px-3 text-sm"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-muted-foreground text-xs" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={sp.status ?? ""}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="REJECTED">Rejected</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>
            <Button type="submit" size="sm">
              Apply
            </Button>
          </form>

          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No members found.</p>
          ) : (
            <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Halqa</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.halqa.replaceAll("_", " ")}</TableCell>
                    <TableCell>{r.genderUnit}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/dashboard/reports/monthly?memberId=${encodeURIComponent(r.id)}&month=${encodeURIComponent(currentMonthYyyyMm())}`}
                          className={cn(
                            buttonVariants({ variant: "secondary", size: "sm" }),
                          )}
                        >
                          Monthly report
                        </Link>
                        {r.status !== "DEACTIVATED" ? (
                          <form action={deactivateMember}>
                            <input type="hidden" name="userId" value={r.id} />
                            <Button
                              type="submit"
                              variant="destructive"
                              size="sm"
                            >
                              Deactivate
                            </Button>
                          </form>
                        ) : null}
                        <form action={adminSendPasswordResetEmail}>
                          <input type="hidden" name="userId" value={r.id} />
                          <Button type="submit" variant="outline" size="sm">
                            Reset email
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <Link
                href={`/dashboard/members?${new URLSearchParams({
                  ...(sp.q ? { q: sp.q } : {}),
                  ...(sp.status ? { status: sp.status } : {}),
                  page: String(safePage - 1),
                }).toString()}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  safePage <= 1 && "pointer-events-none opacity-40",
                )}
              >
                Previous
              </Link>
              <span>
                Page {safePage} / {totalPages}
              </span>
              <Link
                href={`/dashboard/members?${new URLSearchParams({
                  ...(sp.q ? { q: sp.q } : {}),
                  ...(sp.status ? { status: sp.status } : {}),
                  page: String(safePage + 1),
                }).toString()}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  safePage >= totalPages && "pointer-events-none opacity-40",
                )}
              >
                Next
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
