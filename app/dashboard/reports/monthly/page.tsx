import { auth } from "@/auth";
import { MemberMonthlyReportClient } from "@/components/dashboard/member-monthly-report-client";
import { isStaffRole, type StaffRole } from "@/lib/auth/roles";
import {
  getMemberMonthlyReport,
  getUnitStaffCounterpart,
  listMembersForReportPicker,
} from "@/lib/queries/member-monthly-report";
import { monthYyyyMmToRange } from "@/lib/utils/date";
import { redirect } from "next/navigation";

function defaultMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; memberId?: string; cpage?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect("/login");
  }

  const sp = await searchParams;
  const month = sp.month?.trim() || defaultMonth();
  const memberId = sp.memberId?.trim() || "";
  const contactsPage = Math.max(1, Number.parseInt(sp.cpage ?? "1", 10) || 1);

  const [picker, counterpart] = await Promise.all([
    listMembersForReportPicker(),
    getUnitStaffCounterpart(),
  ]);

  let error: string | null = null;
  let report = null;

  if (!monthYyyyMmToRange(month)) {
    error = "Invalid month.";
  } else if (memberId) {
    report = await getMemberMonthlyReport(memberId, month, {
      contactsPage,
      contactsPageSize: 25,
    });
    if (!report) {
      error =
        "You cannot view this member, or they are not an active member in your scope.";
    }
  }

  return (
    <MemberMonthlyReportClient
      role={session.user.role as StaffRole}
      counterpart={counterpart}
      picker={picker}
      report={report}
      month={month}
      memberId={memberId}
      contactsPage={contactsPage}
      error={error}
    />
  );
}
