import Link from "next/link";
import { loadWeeks } from "@/lib/weeks";
import { createWeek } from "./actions";
import { money } from "@/lib/types";

export const dynamic = "force-dynamic";

function statusClass(s: string): string {
  if (s === "active") return "tier-gold";
  if (s === "archived") return "tier-none";
  return "tier-solid";
}

export default async function WeeksPage() {
  const weeks = await loadWeeks();

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Weekly Menus</h1>
          <p>
            Each week&apos;s meal-prep menu, projected counts, and economics.
            In-store grab-and-go meals stay always-available separately.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18, padding: 16 }}>
        <form
          action={createWeek}
          style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}
        >
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Week of</label>
            <input type="date" name="week_of" required />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Label (optional)</label>
            <input type="text" name="label" placeholder="e.g. New Year cut" />
          </div>
          <button className="btn" type="submit">
            + New week
          </button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Week of</th>
              <th>Label</th>
              <th>Status</th>
              <th className="num">Meals</th>
              <th className="num">Projected</th>
              <th className="num">Revenue</th>
              <th className="num">Gross profit</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.id}>
                <td>
                  <Link href={`/weeks/${w.id}`} className="strong">
                    {w.week_of}
                  </Link>
                </td>
                <td>{w.label ?? <span className="muted">—</span>}</td>
                <td>
                  <span className={`badge ${statusClass(w.status)}`}>
                    {w.status}
                  </span>
                </td>
                <td className="num">{w.meals}</td>
                <td className="num">{w.projectedMeals}</td>
                <td className="num">{money(w.revenue)}</td>
                <td className="num">{money(w.profit)}</td>
              </tr>
            ))}
            {!weeks.length && (
              <tr>
                <td colSpan={7} className="muted">
                  No weeks yet — create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
