import Link from "next/link";
import { auth } from "@/auth";
import {
  listContactsForStaff,
  listDailyLogsForStaff,
} from "@/lib/queries/submissions-staff";
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

const PAGE_SIZE = 40;

export default async function DashboardSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    page?: string;
    cpage?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect("/login");
  }

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const cpage = Math.max(1, Number.parseInt(sp.cpage ?? "1", 10) || 1);

  const [logs, contacts] = await Promise.all([
    listDailyLogsForStaff({
      fromYmd: sp.from,
      toYmd: sp.to,
      page,
      pageSize: PAGE_SIZE,
    }),
    listContactsForStaff({
      fromYmd: sp.from,
      toYmd: sp.to,
      page: cpage,
      pageSize: PAGE_SIZE,
    }),
  ]);

  const logPages = Math.max(1, Math.ceil(logs.total / PAGE_SIZE));
  const contactPages = Math.max(1, Math.ceil(contacts.total / PAGE_SIZE));

  const filterQs = new URLSearchParams();
  if (sp.from) filterQs.set("from", sp.from);
  if (sp.to) filterQs.set("to", sp.to);

  const exportSub = `/api/export/submissions?${filterQs.toString()}`;
  const exportSubXlsx = `/api/export/submissions?${new URLSearchParams({
    ...Object.fromEntries(filterQs.entries()),
    format: "xlsx",
  }).toString()}`;
  const exportContact = `/api/export/contacts?${filterQs.toString()}`;
  const exportContactXlsx = `/api/export/contacts?${new URLSearchParams({
    ...Object.fromEntries(filterQs.entries()),
    format: "xlsx",
  }).toString()}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Submissions & contacts
          </h1>
          <p className="text-muted-foreground text-sm">
            Read-only. Filter by date range (optional).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={exportSub}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Logs CSV
          </Link>
          <Link
            href={exportSubXlsx}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Logs XLSX
          </Link>
          <Link
            href={exportContact}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Contacts CSV
          </Link>
          <Link
            href={exportContactXlsx}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Contacts XLSX
          </Link>
        </div>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
        method="get"
        action="/dashboard/submissions"
      >
        <div className="grid gap-1">
          <label className="text-muted-foreground text-xs" htmlFor="from">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={sp.from ?? ""}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-muted-foreground text-xs" htmlFor="to">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={sp.to ?? ""}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          />
        </div>
        <Button type="submit" size="sm">
          Apply
        </Button>
      </form>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Daily logs</CardTitle>
          <CardDescription>
            {logs.total} entr{logs.total === 1 ? "y" : "ies"} (paged)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {logs.rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No logs in range.</p>
          ) : (
            <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Halqa</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Quran pages</TableHead>
                  <TableHead>Hadith</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.rows.map((r) => (
                  <TableRow key={r.logId}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>
                      <div>{r.memberName}</div>
                      <div className="text-muted-foreground text-xs">
                        {r.memberEmail}
                      </div>
                    </TableCell>
                    <TableCell>{r.halqa.replaceAll("_", " ")}</TableCell>
                    <TableCell>{r.genderUnit}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.quranPages}
                    </TableCell>
                    <TableCell>{r.hadith ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
          {logPages > 1 ? (
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <Link
                href={`/dashboard/submissions?${new URLSearchParams({
                  ...(sp.from ? { from: sp.from } : {}),
                  ...(sp.to ? { to: sp.to } : {}),
                  page: String(page - 1),
                  cpage: String(cpage),
                }).toString()}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  page <= 1 && "pointer-events-none opacity-40",
                )}
              >
                Previous
              </Link>
              <span>
                Page {page} / {logPages}
              </span>
              <Link
                href={`/dashboard/submissions?${new URLSearchParams({
                  ...(sp.from ? { from: sp.from } : {}),
                  ...(sp.to ? { to: sp.to } : {}),
                  page: String(page + 1),
                  cpage: String(cpage),
                }).toString()}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  page >= logPages && "pointer-events-none opacity-40",
                )}
              >
                Next
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>
            {contacts.total} contact{contacts.total === 1 ? "" : "s"} (paged)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contacts.rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No contacts in range.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Log date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.logDate}</TableCell>
                    <TableCell>{r.memberName}</TableCell>
                    <TableCell>{r.contactName}</TableCell>
                    <TableCell>{r.phone}</TableCell>
                    <TableCell>{r.location}</TableCell>
                    <TableCell>{r.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
          {contactPages > 1 ? (
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <Link
                href={`/dashboard/submissions?${new URLSearchParams({
                  ...(sp.from ? { from: sp.from } : {}),
                  ...(sp.to ? { to: sp.to } : {}),
                  page: String(page),
                  cpage: String(cpage - 1),
                }).toString()}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  cpage <= 1 && "pointer-events-none opacity-40",
                )}
              >
                Previous
              </Link>
              <span>
                Page {cpage} / {contactPages}
              </span>
              <Link
                href={`/dashboard/submissions?${new URLSearchParams({
                  ...(sp.from ? { from: sp.from } : {}),
                  ...(sp.to ? { to: sp.to } : {}),
                  page: String(page),
                  cpage: String(cpage + 1),
                }).toString()}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  cpage >= contactPages && "pointer-events-none opacity-40",
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
