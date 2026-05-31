import {
  loadMeals,
  inStoreQty,
  aggregatePull,
  buildLines,
  fmt,
  STATIONS,
  MEAL_CATEGORIES,
  parseCounts,
} from "@/lib/sheets";
import { PrintButton } from "@/app/print/print-button";

export const dynamic = "force-dynamic";

const CREW_SLOTS = [
  "Rice & Noodles",
  "Proteins",
  "Potatoes / Roast",
  "Vegetables",
  "Sauce / Pack",
  "Assembly / Pack",
];

export default async function CrewSheet({
  params,
  searchParams,
}: {
  params: Promise<{ n: string }>;
  searchParams: Promise<{ xp?: string; counts?: string; date?: string }>;
}) {
  const { n } = await params;
  const sp = await searchParams;
  const per = Math.max(1, parseInt(n, 10) || 8);
  const xpByCode = parseCounts(sp.xp);
  const custom = parseCounts(sp.counts);
  const hasCustom = Object.keys(custom).length > 0;

  const meals = await loadMeals(!hasCustom); // all active meals if custom counts given
  const qtyByCode = hasCustom ? custom : inStoreQty(meals, per);
  const rows = aggregatePull(meals, qtyByCode, xpByCode);

  const buildMeals = meals
    .filter((m) => (qtyByCode[m.code] ?? 0) > 0)
    .sort(
      (a, b) =>
        MEAL_CATEGORIES.indexOf(a.protein_category) -
          MEAL_CATEGORIES.indexOf(b.protein_category) ||
        a.name.localeCompare(b.name)
    );
  const total = buildMeals.reduce((s, m) => s + (qtyByCode[m.code] ?? 0), 0);
  const dateLabel = sp.date ?? "______";

  return (
    <>
      <PrintButton />

      {/* ---------- PAGE 1 — COOK ---------- */}
      <div className="sheet-head">
        <div className="brand">
          Fit <span>&amp;</span> Fresh
        </div>
        <div className="meta">
          PAGE 1 of 2 • COOK · {total} meals · Date {dateLabel} · Shift lead
          ______
        </div>
      </div>
      <div className="sheet-title">
        COOK — fire order: pull raw, cook to the NEED COOKED weight
      </div>

      <div className="crew-strip">
        {CREW_SLOTS.map((c) => (
          <div className="crew-slot" key={c}>
            {c}
            <span className="line" />
          </div>
        ))}
      </div>

      {STATIONS.map((s) => {
        const sr = rows.filter((r) => r.station === s.n);
        if (!sr.length) return null;
        return (
          <div key={s.n} style={{ breakInside: "avoid" }}>
            <div className="cat-head">{s.label}</div>
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
                {sr.map((r) => {
                  const raw = fmt(r.raw, r.unit);
                  const cooked = fmt(r.cooked, r.unit);
                  return (
                    <tr key={r.ingredientId}>
                      <td>
                        {r.name}
                        {r.flagged && <span className="flag"> *</span>}
                      </td>
                      <td className="amt">{raw}</td>
                      <td>{raw !== cooked ? cooked : ""}</td>
                      <td className="chk">☐</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      <div className="box-row">
        <div className="run-of-day">
          <b>Run of Day</b>
          Rice &amp; noodles first (hands-off simmer) → proteins next (grill/oven
          to temp — the big job) → potatoes &amp; roast alongside → vegetables
          last (quick, keep them bright) → cool, then build to the back page &amp;
          label by invoice.
        </div>
        <div className="cook-temp">
          <b>Cook to Temp</b>
          Chicken/turkey 165°F · ground &amp; meatballs 160°F · pork 145°F ·
          shrimp 145°F / opaque · eggs 160°F. Cool 135→70°F in 2 hr, then →41°F
          in 4 hr.
        </div>
      </div>

      {/* ---------- PAGE 2 — BUILD ---------- */}
      <div className="sheet-head page-break">
        <div className="brand">
          Fit <span>&amp;</span> Fresh
        </div>
        <div className="meta">PAGE 2 of 2 • BUILD · {total} meals</div>
      </div>
      <div className="sheet-title">
        BUILD — assemble to the bullets, weigh don&apos;t eyeball
      </div>

      {MEAL_CATEGORIES.filter((c) =>
        buildMeals.some((m) => m.protein_category === c)
      ).map((c) => (
        <div key={c}>
          <div className="build-cat-head">{c}</div>
          <div className="build-grid">
            {buildMeals
              .filter((m) => m.protein_category === c)
              .map((m) => {
                const xp = xpByCode[m.code] ?? 0;
                return (
                  <div className="meal-card" key={m.id}>
                    <div>
                      <span className="badge">{qtyByCode[m.code]}</span>{" "}
                      <span className="mname">{m.name}</span>{" "}
                      <small>{m.code}</small>
                      {xp > 0 && <span className="xp-tag">+{xp}XP</span>}
                      {(m.recipe_estimated || m.recipe_partial) && (
                        <span className="flag"> *</span>
                      )}
                    </div>
                    <ul>
                      {buildLines(m).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                      {xp > 0 && (
                        <li>+{xp} plate(s): add 2 oz protein, label XP</li>
                      )}
                      <li>☐ packed &amp; labeled</li>
                    </ul>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      <div className="pack-label">
        <b>PACK &amp; LABEL</b> — build to the bullets (weigh, don&apos;t eyeball)
        · cheese 0.5 oz on every topped meal · +XP = extra 2 oz protein, label it
        · sort by invoice # before it leaves the line.
      </div>
      <div className="notes-shorts">NOTES / SHORTS:</div>

      <div className="footnote">
        * estimated/partial recipe — confirm with the cook. Cheese standard 0.5
        oz on every topped meal.
      </div>
    </>
  );
}
