"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

export default function PrintMenu() {
  const [n, setN] = useState(8);
  const router = useRouter();
  const go = (path: string) => router.push(path);

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
        Print-ready sheets for <b>{n}×</b> of each always-available in-store
        meal. Each opens ready to Print → Save as PDF.
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

      <button style={card} onClick={() => go(`/print/batch/${n}`)}>
        <b>📋 In-Store Batch Sheet</b> — STEP 1 cooler count + STEP 2 pull/order,
        one page
      </button>
      <button style={card} onClick={() => go(`/print/crew/${n}`)}>
        <b>👨‍🍳 Crew Sheet</b> — COOK (fire order + temps) + BUILD (per meal)
      </button>
      <button style={card} onClick={() => go(`/print/order/${n}?mode=blank`)}>
        <b>🛒 Weekly Order (blank)</b> — every ingredient, NEED/HAVE/ORDER to
        hand-fill
      </button>
      <button style={card} onClick={() => go(`/print/order/${n}`)}>
        <b>🧾 Order Sheet (filled)</b> — NEED pre-computed for the {n}× batch
      </button>

      <p style={{ color: "#6b7c88", fontSize: 13, marginTop: 14 }}>
        Extra-protein plates on the crew sheet: append{" "}
        <code>?xp=40:2,88:1</code> to the crew URL (meal code : XP plate count).
      </p>
    </div>
  );
}
