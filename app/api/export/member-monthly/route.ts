import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { toCsv } from "@/lib/export/csv";
import {
  getMemberMonthlyReport,
  MEMBER_MONTHLY_EXPORT_CONTACTS_PAGE_SIZE,
} from "@/lib/queries/member-monthly-report";
import { isStaffRole } from "@/lib/auth/roles";
import { monthYyyyMmToRange } from "@/lib/utils/date";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const memberId = url.searchParams.get("memberId")?.trim() ?? "";
  const month = url.searchParams.get("month")?.trim() ?? "";
  const format = url.searchParams.get("format");

  if (!memberId || !month || !monthYyyyMmToRange(month)) {
    return NextResponse.json(
      { error: "memberId and valid month required" },
      { status: 400 },
    );
  }

  const report = await getMemberMonthlyReport(memberId, month, {
    contactsPage: 1,
    contactsPageSize: MEMBER_MONTHLY_EXPORT_CONTACTS_PAGE_SIZE,
  });
  if (!report) {
    return NextResponse.json({ error: "Forbidden or not found" }, { status: 403 });
  }

  const baseName = `member-report-${report.member.name.replace(/\s+/g, "-")}-${month}`;

  if (format === "xlsx") {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();

    const wsSum = wb.addWorksheet("Summary");
    const p = report.summary.prayerByStatus;
    const q = report.summary.quranByType;
    const rows: [string, string | number][] = [
      ["Member", report.member.name],
      ["Email", report.member.email],
      ["Halqa", report.member.halqa],
      ["Unit", report.member.genderUnit],
      ["Report month", report.month],
      ["Days with log", `${report.summary.daysWithLog} / ${report.summary.daysInMonth}`],
      ["Contacts logged in report month", report.summary.contactsLoggedInReportMonth],
      ["Total Quran pages (month)", report.summary.totalQuranPages],
      ["Days with Quran logged", report.summary.daysWithQuranSaved],
      ["Ba jamaat (total)", p.BA_JAMAAT],
      ["Munfarid (total)", p.MUNFARID],
      ["Qaza (total)", p.QAZA],
      ["On time (total)", p.ON_TIME],
      ["Qaza (prayer-day count)", report.summary.totalQazaPrayers],
      ["Hadith yes (days)", report.summary.daysHadithYes],
      ["Hadith no (days)", report.summary.daysHadithNo],
      ["Literature yes (days)", report.summary.daysLiteratureYes],
      ["Literature no (days)", report.summary.daysLiteratureNo],
      ["Quran type — Tilawat (days)", q.TILAWAT],
      ["Quran type — Tafseer (days)", q.TAFSEER],
      ["Quran type — Both (days)", q.BOTH],
      ["Contacts — Muslim (all time)", report.contactByStatusAllTime.MUSLIM],
      ["Contacts — Non-Muslim (all time)", report.contactByStatusAllTime.NON_MUSLIM],
      ["Contacts — Total rows (all time)", report.contacts.total],
    ];

    const reportMonthAi = report.aiyanatHistory.find((r) => r.month === report.month);
    if (reportMonthAi) {
      rows.push(["Aiyanat (report month) status", reportMonthAi.status]);
      rows.push(["Aiyanat (report month) amount", reportMonthAi.amount]);
      if (reportMonthAi.paymentDate) {
        rows.push(["Aiyanat (report month) payment date", reportMonthAi.paymentDate]);
      }
    }

    for (const [k, v] of rows) {
      wsSum.addRow([k, v]);
    }

    const wsContacts = wb.addWorksheet("Contacts_all_time");
    wsContacts.columns = [
      { header: "Log date", key: "logDate", width: 12 },
      { header: "Name", key: "name", width: 22 },
      { header: "Phone", key: "phone", width: 14 },
      { header: "Location", key: "location", width: 20 },
      { header: "Status", key: "status", width: 12 },
    ];
    for (const c of report.contacts.rows) {
      wsContacts.addRow({
        logDate: c.logDate,
        name: c.name,
        phone: c.phone,
        location: c.location,
        status: c.status,
      });
    }

    const wsAi = wb.addWorksheet("Aiyanat_history");
    wsAi.columns = [
      { header: "Month", key: "month", width: 10 },
      { header: "Status", key: "status", width: 12 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Payment date", key: "paymentDate", width: 14 },
    ];
    for (const r of report.aiyanatHistory) {
      wsAi.addRow({
        month: r.month,
        status: r.status,
        amount: r.amount,
        paymentDate: r.paymentDate ?? "",
      });
    }

    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(Buffer.from(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
      },
    });
  }

  const summaryRows: Record<string, unknown>[] = [
    { section: "Metric", value: "Value" },
    { section: "Member", value: report.member.name },
    { section: "Report month", value: report.month },
    {
      section: "Days with log",
      value: `${report.summary.daysWithLog}/${report.summary.daysInMonth}`,
    },
    {
      section: "Contacts logged in report month",
      value: report.summary.contactsLoggedInReportMonth,
    },
    { section: "Total Quran pages (month)", value: report.summary.totalQuranPages },
    { section: "Days with Quran logged", value: report.summary.daysWithQuranSaved },
    { section: "Ba jamaat total", value: report.summary.prayerByStatus.BA_JAMAAT },
    { section: "Munfarid total", value: report.summary.prayerByStatus.MUNFARID },
    { section: "Qaza total", value: report.summary.prayerByStatus.QAZA },
    { section: "On time total", value: report.summary.prayerByStatus.ON_TIME },
    { section: "Hadith yes days", value: report.summary.daysHadithYes },
    { section: "Hadith no days", value: report.summary.daysHadithNo },
    { section: "Literature yes days", value: report.summary.daysLiteratureYes },
    { section: "Literature no days", value: report.summary.daysLiteratureNo },
    {
      section: "Contacts Muslim (all time)",
      value: report.contactByStatusAllTime.MUSLIM,
    },
    {
      section: "Contacts Non-Muslim (all time)",
      value: report.contactByStatusAllTime.NON_MUSLIM,
    },
    { section: "Contacts total rows", value: report.contacts.total },
  ];

  const summaryCsv = toCsv(summaryRows);
  const contactCsv = toCsv(
    report.contacts.rows.map((c) => ({
      logDate: c.logDate,
      name: c.name,
      phone: c.phone,
      location: c.location,
      status: c.status,
    })),
  );

  const aiCsv = toCsv(
    report.aiyanatHistory.map((r) => ({
      month: r.month,
      status: r.status,
      amount: r.amount,
      paymentDate: r.paymentDate ?? "",
    })),
  );

  const csv = `${summaryCsv}\n\nContacts_all_time\n${contactCsv || "(none)"}\n\nAiyanat_history\n${aiCsv || "(none)"}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}.csv"`,
    },
  });
}
