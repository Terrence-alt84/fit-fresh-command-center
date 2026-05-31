import {
  loadMeals,
  inStoreQty,
  aggregatePull,
  loadAllIngredients,
  parseCounts,
  fmt,
  CATEGORY_ORDER,
  Unit,
} from "@/lib/sheets";
import { PrintButton } from "@/app/print/print-button";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  cat: string;
  unit: Unit;
  need: string | null;
  flagged: boolean;
};

export default async function OrderSheet({
  params,
  searchParams,
}: {
  params: Promise<{ n: string }>;
  searchParams: Promise<{
    mode?: string;
    counts?: string;
    week?: string;
    label?: string;
  }>;
}) {
  const { n } = await params;
  const sp = await searchParams;
  const per = Math.max(1, parseInt(n, 10) || 8);
  const blank = sp.mode === "blank";
  const weekLabel = sp.week ? `Week of ${sp.week}` : "Week of ______";

  let rows: Row[];
  if (blank) {
    const ings = await loadAllIngredients();
    rows = ings.map((i) => ({
      id: i.id,
      name: i.name,
      cat: i.category,
      unit: i.order_unit,
      need: null,
      flagged: false,
    }));
  } else {
    const custom = parseCounts(sp.counts);
    const hasCustom = Object.keys(custom).length > 0;
    const meals = await loadMeals(!hasCustom);
    const agg = aggregatePull(meals, hasCustom ? custom : inStoreQty(meals, per));
    rows = agg.map((r) => ({
      id: r.ingredientId,
      name: r.name,
      cat: r.category,
      unit: r.unit,
      need: fmt(r.raw, r.unit),
      flagged: r.flagged,
    }));
  }

  const groups = CATEGORY_ORDER.map((cat) => ({
    cat,
    rows: rows.filter((r) => r.cat === cat),
  })).filter((g) => g.rows.length > 0);

  return (
    <>
      <PrintButton />
      <div className="sheet-head">
        <div className="brand">
          Fit <span>&amp;</span> Fresh
        </div>
        <div className="meta">
          {sp.label ?? (blank ? "Standby Order" : "Order Sheet")} ·{" "}
          {blank ? "all ingredients" : `${per}× each`} · {weekLabel}
        </div>
      </div>
      <div className="sheet-title">
        {blank
          ? "WEEKLY ORDER — count HAVE, write ORDER = NEED − HAVE"
          : "ORDER SHEET — NEED is the batch; count HAVE, write ORDER = NEED − HAVE"}
      </div>

      <div className="cols2">
        {groups.map((g) => (
          <div key={g.cat} style={{ breakInside: "avoid" }}>
            <div className="cat-head">{g.cat}</div>
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
                {g.rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.name}
                      {r.flagged && <span className="flag"> *</span>}
                    </td>
                    <td className="amt">{r.need ?? ""}</td>
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
        Read NEED → count what you HAVE → ORDER = NEED − HAVE. Yields
        (cooked→raw): chicken/steak ÷0.75 · ground ÷0.72 · pork ÷0.60 · shrimp
        ÷0.85 · rice/quinoa ÷3 dry · pasta ÷2.4 dry · grits ÷4 dry. * =
        estimated/partial recipe.
      </div>
    </>
  );
}
