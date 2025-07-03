import React from "react";

function SummaryTable({ summary }) {
  const { participants, meetings, data } = summary;
  return (
    <table border="1" cellPadding="5">
      <thead>
        <tr>
          <th>Participant</th>
          {meetings.map((m) => (
            <th key={m.id}>{m.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {participants.map((p) => (
          <tr key={p.id}>
            <td>{p.name}</td>
            {meetings.map((m) => (
              <td key={m.id}>
                {data[p.email] && data[p.email][m.id] !== undefined
                  ? `${data[p.email][m.id]} min`
                  : ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default SummaryTable;