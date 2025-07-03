import Papa from "papaparse";

// Helper: parse time string to Date
function parseTime(str) {
  // Try ISO, fallback to locale
  const d = new Date(str);
  if (isNaN(d)) throw new Error(`Invalid date: ${str}`);
  return d;
}

// Helper: get minutes between two dates
function diffMinutes(a, b) {
  return Math.max(0, Math.round((b - a) / 60000));
}

// Main processing function
export async function processAttendanceFiles(files, minThreshold = 2) {
  // Arrays to collect all meetings and participants
  const meetings = [];
  const participantsSet = new Map(); // id/email -> { name, email }
  const data = {}; // participantEmail: { meetingId: minutes }

  for (const file of files) {
    const text = await file.text();
    const { data: rows, errors, meta } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    // Validate required columns
    const required = ["Full Name", "User Action", "Timestamp", "Email", "Role"];
    const missing = required.filter((col) => !meta.fields.includes(col));
    if (missing.length) {
      throw new Error(
        `File "${file.name}" is missing columns: ${missing.join(", ")}`
      );
    }

    // Find organizer
    const organizerRow = rows.find((r) => r.Role && r.Role.toLowerCase().includes("organizer"));
    if (!organizerRow) {
      throw new Error(`File "${file.name}" does not contain organizer info.`);
    }
    const meetingId = file.name;
    const meetingName = file.name.replace(/\.csv$/i, "");
    // Get all organizer join/leave times
    const organizerTimes = rows
      .filter((r) => r.Email === organizerRow.Email)
      .map((r) => ({
        action: r["User Action"],
        time: parseTime(r.Timestamp),
      }))
      .sort((a, b) => a.time - b.time);

    // Find organizer's presence interval(s)
    let orgIntervals = [];
    let lastJoin = null;
    for (const ev of organizerTimes) {
      if (ev.action === "Joined") lastJoin = ev.time;
      if (ev.action === "Left" && lastJoin) {
        orgIntervals.push([lastJoin, ev.time]);
        lastJoin = null;
      }
    }
    // If organizer never left, use last timestamp
    if (lastJoin) {
      orgIntervals.push([lastJoin, organizerTimes[organizerTimes.length - 1].time]);
    }
    if (!orgIntervals.length) {
      throw new Error(`Could not determine organizer's presence in "${file.name}"`);
    }

    meetings.push({ id: meetingId, name: meetingName });

    // Group participant events by email
    const eventsByEmail = {};
    for (const row of rows) {
      if (!row.Email) continue;
      if (!eventsByEmail[row.Email]) eventsByEmail[row.Email] = [];
      eventsByEmail[row.Email].push({
        name: row["Full Name"],
        action: row["User Action"],
        time: parseTime(row.Timestamp),
        role: row.Role,
      });
    }

    // For each participant, calculate total time (within organizer intervals)
    for (const [email, events] of Object.entries(eventsByEmail)) {
      // Skip organizer
      if (email === organizerRow.Email) continue;
      // Sort by time
      events.sort((a, b) => a.time - b.time);

      // Find join/leave pairs
      let intervals = [];
      let joinTime = null;
      for (const ev of events) {
        if (ev.action === "Joined") joinTime = ev.time;
        if (ev.action === "Left" && joinTime) {
          intervals.push([joinTime, ev.time]);
          joinTime = null;
        }
      }
      // If joined but never left, use last event time
      if (joinTime) {
        intervals.push([joinTime, events[events.length - 1].time]);
      }

      // For each interval, clip to organizer intervals
      let totalMinutes = 0;
      for (const [start, end] of intervals) {
        for (const [orgStart, orgEnd] of orgIntervals) {
          // Find overlap
          const s = new Date(Math.max(start, orgStart));
          const e = new Date(Math.min(end, orgEnd));
          if (e > s) {
            totalMinutes += diffMinutes(s, e);
          }
        }
      }

      // Apply threshold
      if (totalMinutes >= minThreshold) {
        participantsSet.set(email, { name: events[0].name, email });
        if (!data[email]) data[email] = {};
        data[email][meetingId] = totalMinutes;
      }
    }
  }

  // Prepare participants and meetings arrays
  const participants = Array.from(participantsSet.values());

  return { participants, meetings, data };
}