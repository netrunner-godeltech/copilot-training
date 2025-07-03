import { processAttendanceFiles } from "./parseAttendance";
import { processAttendanceFilesNewFormat } from "./parseAttendanceNewFormat";

// Detects file format and uses the correct parser
export async function detectAndParseAttendance(files, minThreshold = 2) {
  // Read the first file to detect format
  const text = await files[0].text();
  if (text.includes("2. Participants") && text.includes("In-Meeting Duration")) {
    // New format
    return processAttendanceFilesNewFormat(files, minThreshold);
  } else {
    // Old format
    return processAttendanceFiles(files, minThreshold);
  }
}
