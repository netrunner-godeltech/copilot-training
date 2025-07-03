import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import SummaryTable from "./components/SummaryTable";
import { processAttendanceFiles } from "./utils/parseAttendance";
import { exportToExcel } from "./utils/exportToExcel";
import './App.css';

function App() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const handleFiles = async (files) => {
    setError("");
    try {
      const result = await processAttendanceFiles(files);
      setSummary(result);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="App" style={{ padding: 20 }}>
      <h2>Meeting Attendance Summary</h2>
      <FileUpload onFilesSelected={handleFiles} />
      {error && <div style={{ color: "red" }}>{error}</div>}
      {summary && (
        <>
          <SummaryTable summary={summary} />
          <button onClick={() => exportToExcel(summary)}>Export to Excel</button>
        </>
      )}
    </div>
  );
}

export default App;
