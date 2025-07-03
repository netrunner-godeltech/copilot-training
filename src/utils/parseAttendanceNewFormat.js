import Papa from "papaparse";

// Parser for the new format (meeting1-new-format.csv)
export async function processAttendanceFilesNewFormat(files, minThreshold = 2) {
  // Arrays to collect all meetings and participants
  const meetings = [];
  const participantsSet = new Map(); // id/email -> { name, email }
  const data = {}; // participantEmail: { meetingId: minutes }

  for (const file of files) {
    const text = await file.text();
    // Find the Participants section
    const lines = text.split(/\r?\n/);
    const partIdx = lines.findIndex(l => l.trim().startsWith("2. Participants"));
    if (partIdx === -1) throw new Error("No '2. Participants' section found");
    // Find the header and data rows
    const headerIdx = partIdx + 1;
    const header = lines[headerIdx].split("\t");
    let dataRows = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      if (!lines[i].trim() || lines[i].match(/^\d+\./)) break; // next section or empty
      dataRows.push(lines[i].split("\t"));
    }
    // Map rows to objects
    const rows = dataRows.map(cols => Object.fromEntries(header.map((h, i) => [h, cols[i]])));
    // Find organizer
    const organizerRow = rows.find(r => r.Role && r.Role.toLowerCase().includes("organizer"));
    if (!organizerRow) throw new Error("No organizer found in participants");
    const meetingId = file.name;
    const meetingName = file.name.replace(/\.csv$/i, "");
    meetings.push({ id: meetingId, name: meetingName });
    // For each participant, calculate duration
    for (const row of rows) {
      if (!row.Email) continue;
      // Skip organizer
      if (row.Email === organizerRow.Email) continue;
      // Parse duration (e.g. '39m 28s')
      let min = 0;
      if (row["In-Meeting Duration"]) {
        const m = row["In-Meeting Duration"].match(/(\d+)m/);
        const s = row["In-Meeting Duration"].match(/(\d+)s/);
        min = (m ? parseInt(m[1]) : 0) + (s ? parseInt(s[1]) / 60 : 0);
        min = Math.round(min);
      }
      if (min >= minThreshold) {
        participantsSet.set(row.Email, { name: row.Name, email: row.Email });
        if (!data[row.Email]) data[row.Email] = {};
        data[row.Email][meetingId] = min;
      }
    }
  }
  const participants = Array.from(participantsSet.values());
  return { participants, meetings, data };
}
