import * as XLSX from "xlsx";

export function exportToExcel(summary) {
  const { participants, meetings, data } = summary;

  // Prepare header row
  const header = ["Participant", "Email", ...meetings.map((m) => m.name)];

  // Prepare data rows
  const rows = participants.map((p) => [
    p.name,
    p.email,
    ...meetings.map((m) =>
      data[p.email] && data[p.email][m.id] ? data[p.email][m.id] : ""
    ),
  ]);

  // Combine header and rows
  const aoa = [header, ...rows];

  // Create worksheet and workbook
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance Summary");

  // Export
  XLSX.writeFile(wb, "attendance_summary.xlsx");
}