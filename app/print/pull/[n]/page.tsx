import {
  loadMeals,
  aggregatePull,
  inStoreQty,
  fmt,
  CATEGORY_ORDER,
} from "@/lib/sheets";
import { PrintButton } from "@/app/print/print-button";

export const dynamic = "force-dynamic";

export default async function PullSheet({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const per = Math.max(1, parseInt(n, 10) || 8);
  const meals = await loadMeals(true);
  const rows = aggregatePull(meals, inStoreQty(meals, per));
  const total = meals.filter((m) => m.is_in_store).length * per;
  const anyFlagged = rows.some((r) => r.flagged);
  const cats = CATEGORY_ORDER.filter((c) => rows.some((r) => r.category === c));

  return (
    <>
      <PrintButton />
      <div className="sheet-head">
        <div className="brand">
          Fit <span>&amp;</span> Fresh
        </div>
        <div className="meta">
          In-Store Pull · {per}× each · {total} meals
        </div>
      </div>
      <div className="sheet-title">PULL LIST — raw / dry quantities</div>

      <div className="cols2">
        {cats.map((cat) => (
          <div key={cat} style={{ breakInside: "avoid" }}>
            <div className="cat-head">{cat}</div>
            <table className="grid">
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
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {anyFlagged && (
        <div className="footnote">
          * contains an estimated/partial recipe — verify the amount with the
          cook before ordering.
        </div>
      )}
    </>
  );
}
