import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { toCsv } from "@/lib/export/csv";
import { getMemberMonthlyReport } from "@/lib/queries/member-monthly-report";
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
    return NextResponse.json({ error: "memberId and valid month required" }, { status: 400 });
  }

  const report = await getMemberMonthlyReport(memberId, month);
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
      ["Month", report.month],
      ["Days with log", `${report.summary.daysWithLog} / ${report.summary.daysInMonth}`],
      ["Total Quran pages", report.summary.totalQuranPages],
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
      ["Contact — Muslim", report.contactByStatus.MUSLIM],
      ["Contact — Non-Muslim", report.contactByStatus.NON_MUSLIM],
      ["Total contacts", report.summary.totalContacts],
    ];
    if (report.aiyanat) {
      rows.push(["Aiyanat status", report.aiyanat.status]);
      rows.push(["Aiyanat amount", report.aiyanat.amount]);
      if (report.aiyanat.paymentDate) {
        rows.push(["Payment date", report.aiyanat.paymentDate]);
      }
    }
    for (const [k, v] of rows) {
      wsSum.addRow([k, v]);
    }

    const wsTrends = wb.addWorksheet("Daily_trends");
    wsTrends.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Has log", key: "hasLog", width: 10 },
      { header: "Quran pages", key: "quran", width: 12 },
      { header: "Qaza count", key: "qaza", width: 10 },
      { header: "Hadith", key: "hadith", width: 8 },
      { header: "Literature", key: "literature", width: 10 },
      { header: "Contacts", key: "contacts", width: 10 },
    ];
    for (const d of report.dailySeries) {
      wsTrends.addRow({
        date: d.ymd,
        hasLog: d.hasLog ? "Yes" : "No",
        quran: d.quranPages,
        qaza: d.qazaCount,
        hadith: d.hadith ? "Yes" : "No",
        literature: d.literature ? "Yes" : "No",
        contacts: d.contactCount,
      });
    }

    const wsContacts = wb.addWorksheet("Contacts");
    wsContacts.columns = [
      { header: "Log date", key: "logDate", width: 12 },
      { header: "Name", key: "name", width: 22 },
      { header: "Phone", key: "phone", width: 14 },
      { header: "Location", key: "location", width: 20 },
      { header: "Status", key: "status", width: 12 },
    ];
    for (const c of report.contactRows) {
      wsContacts.addRow({
        logDate: c.logDate,
        name: c.name,
        phone: c.phone,
        location: c.location,
        status: c.status,
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
    { section: "Month", value: report.month },
    { section: "Days with log", value: `${report.summary.daysWithLog}/${report.summary.daysInMonth}` },
    { section: "Total Quran pages", value: report.summary.totalQuranPages },
    { section: "Days with Quran logged", value: report.summary.daysWithQuranSaved },
    { section: "Ba jamaat total", value: report.summary.prayerByStatus.BA_JAMAAT },
    { section: "Munfarid total", value: report.summary.prayerByStatus.MUNFARID },
    { section: "Qaza total", value: report.summary.prayerByStatus.QAZA },
    { section: "On time total", value: report.summary.prayerByStatus.ON_TIME },
    { section: "Hadith yes days", value: report.summary.daysHadithYes },
    { section: "Hadith no days", value: report.summary.daysHadithNo },
    { section: "Literature yes days", value: report.summary.daysLiteratureYes },
    { section: "Literature no days", value: report.summary.daysLiteratureNo },
    { section: "Total contacts", value: report.summary.totalContacts },
  ];

  const summaryCsv = toCsv(summaryRows);
  const contactCsv = toCsv(
    report.contactRows.map((c) => ({
      logDate: c.logDate,
      name: c.name,
      phone: c.phone,
      location: c.location,
      status: c.status,
    })),
  );

  const csv = `${summaryCsv}\n\nContacts\n${contactCsv || "(none)"}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}.csv"`,
    },
  });
}
