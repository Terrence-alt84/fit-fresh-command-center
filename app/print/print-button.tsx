"use client";

export function PrintButton() {
  return (
    <button className="no-print printbtn" onClick={() => window.print()}>
      🖨 Print / Save as PDF
    </button>
  );
}
