import { auth } from "@/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isStaffRole } from "@/lib/auth/roles";
import { listAiyanatForStaff } from "@/lib/queries/aiyanat";
import { redirect } from "next/navigation";

export default async function DashboardAiyanatPage() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect("/login");
  }

  const rows = await listAiyanatForStaff();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Aiyanat
        </h1>
        <p className="text-muted-foreground text-sm">
          {session.user.role === "ADMIN"
            ? "All halqas."
            : `Scoped to ${session.user.halqa.replaceAll("_", " ")} · ${session.user.genderUnit}.`}
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <CardDescription>
            Monthly yes/no from members, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No Aiyanat records yet.</p>
          ) : (
            <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Halqa</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Contributed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.month}</TableCell>
                    <TableCell>
                      <div>{r.memberName}</div>
                      <div className="text-muted-foreground text-xs">
                        {r.memberEmail}
                      </div>
                    </TableCell>
                    <TableCell>{r.halqa.replaceAll("_", " ")}</TableCell>
                    <TableCell>{r.genderUnit}</TableCell>
                    <TableCell>
                      {r.status === "PAID" ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
