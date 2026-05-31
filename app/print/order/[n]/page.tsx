import {
  loadMeals,
  aggregatePull,
  inStoreQty,
  fmt,
  CATEGORY_ORDER,
} from "@/lib/sheets";
import { PrintButton } from "@/app/print/print-button";

export const dynamic = "force-dynamic";

export default async function OrderSheet({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const per = Math.max(1, parseInt(n, 10) || 8);
  const meals = await loadMeals(true);
  const rows = aggregatePull(meals, inStoreQty(meals, per));
  const total = meals.filter((m) => m.is_in_store).length * per;
  const cats = CATEGORY_ORDER.filter((c) => rows.some((r) => r.category === c));

  return (
    <>
      <PrintButton />
      <div className="sheet-head">
        <div className="brand">
          Fit <span>&amp;</span> Fresh
        </div>
        <div className="meta">
          Order Sheet · {per}× each · {total} meals
        </div>
      </div>
      <div className="sheet-title">
        ORDER SHEET — NEED is the batch; count the walk-in, fill HAVE → ORDER
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
        NEED = full batch raw/dry. Count what&apos;s in the walk-in (HAVE), then
        ORDER = NEED − HAVE. * = estimated/partial recipe.
      </div>
    </>
  );
}
