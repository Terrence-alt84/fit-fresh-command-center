import {
  loadMeals,
  aggregatePull,
  inStoreQty,
  fmt,
  FIRE_ORDER,
  buildLines,
} from "@/lib/sheets";
import { PrintButton } from "@/app/print/print-button";

export const dynamic = "force-dynamic";

export default async function CrewSheet({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const per = Math.max(1, parseInt(n, 10) || 8);
  const meals = await loadMeals(true);
  const inStore = meals
    .filter((m) => m.is_in_store)
    .sort(
      (a, b) =>
        a.protein_category.localeCompare(b.protein_category) ||
        a.name.localeCompare(b.name)
    );
  const rows = aggregatePull(meals, inStoreQty(meals, per));
  const total = inStore.length * per;
  const stations = FIRE_ORDER.filter((s) =>
    rows.some((r) => r.category === s.cat)
  );

  return (
    <>
      <PrintButton />

      {/* ---------- COOK PAGE ---------- */}
      <div className="sheet-head">
        <div className="brand">
          Fit <span>&amp;</span> Fresh
        </div>
        <div className="meta">
          Crew · COOK · {per}× each · {total} meals
        </div>
      </div>
      <div className="sheet-title">COOK — fire order · pull raw, cook to target</div>

      {stations.map((s) => (
        <div key={s.cat} style={{ breakInside: "avoid" }}>
          <div className="cat-head">{s.station}</div>
          <table className="grid">
            <thead>
              <tr>
                <th>Item</th>
                <th>Pull raw / dry</th>
                <th>Need cooked</th>
                <th>✓</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => r.category === s.cat)
                .map((r) => (
                  <tr key={r.ingredientId}>
                    <td>
                      {r.name}
                      {r.flagged && <span className="flag"> *</span>}
                    </td>
                    <td className="amt">{fmt(r.raw, r.unit)}</td>
                    <td className="amt">{fmt(r.cooked, r.unit)}</td>
                    <td className="chk">☐</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* ---------- BUILD PAGE ---------- */}
      <div className="sheet-head page-break">
        <div className="brand">
          Fit <span>&amp;</span> Fresh
        </div>
        <div className="meta">Crew · BUILD · {per}× each</div>
      </div>
      <div className="sheet-title">BUILD — assemble each meal</div>

      <div className="build-grid">
        {inStore.map((m) => (
          <div className="meal-card" key={m.id}>
            <div>
              <span className="badge">{per}×</span>{" "}
              <span className="mname">{m.name}</span>{" "}
              <small>{m.code}</small>
              {(m.recipe_estimated || m.recipe_partial) && (
                <span className="flag"> *</span>
              )}
            </div>
            <ul>
              {buildLines(m).map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
              <li>☐ packed &amp; labeled</li>
            </ul>
          </div>
        ))}
      </div>

      <div className="footnote">
        * estimated/partial recipe — confirm with the cook. Cheese standard 0.5
        oz on every topped meal.
      </div>
    </>
  );
}
