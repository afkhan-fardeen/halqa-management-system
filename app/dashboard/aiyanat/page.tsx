import { auth } from "@/auth";
import {
  StaffPageHeader,
  StaffPanel,
} from "@/components/dashboard/staff-page-section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="space-y-8">
      <StaffPageHeader
        title="Aiyanat"
        description={
          session.user.role === "ADMIN"
            ? "All halqas."
            : `Scoped to ${session.user.halqa.replaceAll("_", " ")} · ${session.user.genderUnit}.`
        }
      />

      <StaffPanel
        title="Records"
        description="Monthly yes/no from members, newest first."
      >
        {rows.length === 0 ? (
          <p className="text-sm text-staff-on-surface-variant">No Aiyanat records yet.</p>
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
                      <div className="text-xs text-staff-on-surface-variant">
                        {r.memberEmail}
                      </div>
                    </TableCell>
                    <TableCell>{r.halqa.replaceAll("_", " ")}</TableCell>
                    <TableCell>{r.genderUnit}</TableCell>
                    <TableCell>{r.status === "PAID" ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </StaffPanel>
    </div>
  );
}
