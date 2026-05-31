"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

export default function PrintMenu() {
  const [n, setN] = useState(8);
  const router = useRouter();
  const go = (kind: string) => router.push(`/print/${kind}/${n}`);

  const card: CSSProperties = {
    display: "block",
    width: "100%",
    textAlign: "left",
    border: "1px solid #c7d4de",
    borderRadius: 8,
    padding: "12px 16px",
    margin: "8px 0",
    background: "#fff",
    cursor: "pointer",
    fontSize: 15,
    color: "#0e4368",
  };

  return (
    <div className="no-print" style={{ maxWidth: 560 }}>
      <h1 style={{ color: "#155a8a" }}>Kitchen Sheets</h1>
      <p style={{ color: "#6b7c88" }}>
        Generate a print-ready sheet for <b>{n}×</b> of each always-available
        in-store meal. Each opens ready to Print → Save as PDF.
      </p>

      <label style={{ fontWeight: 600 }}>
        Quantity per meal:{" "}
        <input
          type="number"
          min={1}
          value={n}
          onChange={(e) => setN(Math.max(1, parseInt(e.target.value, 10) || 1))}
          style={{ width: 70, padding: 4, fontSize: 15 }}
        />
      </label>
      <p>
        Presets:{" "}
        <button onClick={() => setN(8)} style={{ marginRight: 6 }}>
          8× in-store batch
        </button>
        <button onClick={() => setN(50)}>50× Friday batch</button>
      </p>

      <button style={card} onClick={() => go("pull")}>
        <b>📋 Pull list</b> — raw/dry quantities to pull, NEED filled in
      </button>
      <button style={card} onClick={() => go("order")}>
        <b>🛒 Order sheet</b> — NEED / HAVE / ORDER / ✓ for the walk-in count
      </button>
      <button style={card} onClick={() => go("crew")}>
        <b>👨‍🍳 Crew sheet</b> — Cook page (fire order) + Build page (per meal)
      </button>
    </div>
  );
}
