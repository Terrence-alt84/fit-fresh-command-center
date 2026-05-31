import {
  loadMeals,
  inStoreQty,
  aggregatePull,
  buildLines,
  fmt,
  CATEGORY_ORDER,
  MEAL_CATEGORIES,
} from "@/lib/sheets";
import { PrintButton } from "@/app/print/print-button";

export const dynamic = "force-dynamic";

export default async function BatchSheet({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const per = Math.max(1, parseInt(n, 10) || 8);
  const meals = await loadMeals(true);
  const ordered = meals
    .slice()
    .sort(
      (a, b) =>
        MEAL_CATEGORIES.indexOf(a.protein_category) -
          MEAL_CATEGORIES.indexOf(b.protein_category) ||
        a.name.localeCompare(b.name)
    );
  const rows = aggregatePull(meals, inStoreQty(meals, per));
  const total = meals.length * per;
  const cats = CATEGORY_ORDER.filter((c) => rows.some((r) => r.category === c));

  return (
    <>
      <PrintButton />
      <div className="sheet-head">
        <div className="brand">
          Fit <span>&amp;</span> Fresh
        </div>
        <div className="meta">
          In-Store Batch · {per} of each · {meals.length} meals = {total} total ·
          Date ______
        </div>
      </div>

      <div className="step-label">
        STEP 1 — COUNT THE COOLER · TO MAKE = TARGET − IN COOLER
      </div>
      <table className="grid">
        <thead>
          <tr>
            <th>#</th>
            <th>Meal</th>
            <th>What&apos;s in it</th>
            <th>Target</th>
            <th>In cooler</th>
            <th>To make</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((m) => (
            <tr key={m.id}>
              <td className="amt">{m.code}</td>
              <td>
                {m.name}
                {(m.recipe_estimated || m.recipe_partial) && (
                  <span className="flag"> *</span>
                )}
              </td>
              <td className="whats">{buildLines(m).join(" · ")}</td>
              <td className="target">{per}</td>
              <td className="cream">&nbsp;</td>
              <td className="cream">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="step-label">
        STEP 2 — PULL &amp; ORDER · NEED is the full batch (raw / dry)
      </div>
      <div className="cols2">
        {cats.map((cat) => (
          <div key={cat} style={{ breakInside: "avoid" }}>
            <div className="cat-head">{cat}</div>
            <table className="grid">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Need</th>
                  <th>Have</th>
                  <th>Order</th>
                  <th>✓</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((r) => r.category === cat)
                  .map((r) => (
                    <tr key={r.ingredientId}>
                      <td>
                        {r.name}
                        {r.flagged && <span className="flag"> *</span>}
                      </td>
                      <td className="amt">{fmt(r.raw, r.unit)}</td>
                      <td className="box">&nbsp;</td>
                      <td className="box">&nbsp;</td>
                      <td className="chk">☐</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="footnote">
        Yields (cooked→raw): chicken/steak ÷0.75 · ground ÷0.72 · pork ÷0.60 ·
        shrimp ÷0.85 · rice/quinoa ÷3 dry · pasta ÷2.4 dry · grits ÷4 dry ·
        potatoes ÷0.75 · cabbage ÷0.70. NEED = full batch raw/dry; if the cooler
        already has stock, scale the order down. * = estimated/partial recipe.
      </div>
    </>
  );
}
