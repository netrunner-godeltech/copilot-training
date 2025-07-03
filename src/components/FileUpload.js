import React from "react";

function FileUpload({ onFilesSelected }) {
  return (
    <div>
      <input
        type="file"
        accept=".csv"
        multiple
        onChange={(e) => onFilesSelected(Array.from(e.target.files))}
      />
    </div>
  );
}

export default FileUpload;