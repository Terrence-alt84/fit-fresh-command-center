import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { Ingredient, MealCost, money, pct, marginTier } from "@/lib/types";
import { lineCost } from "@/lib/costing";
import { updateMealSellPrice, updateRecipeLine } from "@/app/actions";

export const dynamic = "force-dynamic";

type Line = { id: string; amount: number; ingredient: Ingredient };

export default async function MealDetail({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = "#" + decodeURIComponent(raw);
  const supabase = getSupabase();

  const { data: meal } = await supabase
    .from("meals")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (!meal) notFound();

  const { data: linesData } = await supabase
    .from("meal_ingredients")
    .select("id, amount, ingredient:ingredients(*)")
    .eq("meal_id", meal.id);
  const lines = (linesData ?? []) as unknown as Line[];

  const { data: mc } = await supabase
    .from("meal_cost")
    .select("*")
    .eq("id", meal.id)
    .maybeSingle();
  const cost = mc as MealCost | null;

  const tier = marginTier(cost?.cost_complete ? cost?.margin_pct ?? null : null);

  return (
    <>
      <Link href="/" className="back-link">
        ← Back to profitability
      </Link>
      <div className="page-head">
        <div>
          <h1>{meal.name}</h1>
          <p>
            <span className="meal-code">{meal.code}</span> · {meal.protein_category}
            {meal.is_in_store && <span className="chip chip-store">In-store</span>}
            {(meal.recipe_estimated || meal.recipe_partial) && (
              <span className="chip chip-flag">
                {meal.recipe_partial ? "Partial recipe" : "Estimated"}
              </span>
            )}
          </p>
        </div>
        <span className={"badge " + tier.cls} style={{ fontSize: 13, padding: "5px 12px" }}>
          {tier.label}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 18, alignItems: "start" }}>
        {/* Recipe / cost calculator */}
        <div className="card">
          <div className="card-head">Recipe Cost Calculator</div>
          <table>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Category</th>
                <th className="num">Amount</th>
                <th>Unit</th>
                <th className="num">Line Cost</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const lc = lineCost(l.ingredient, Number(l.amount));
                return (
                  <tr key={l.id}>
                    <td className="meal-name">
                      {l.ingredient.name}
                      {l.ingredient.is_cheese && (
                        <span className="chip chip-flag">0.5oz std</span>
                      )}
                      {l.ingredient.raw_price === null && (
                        <span className="chip chip-incomplete">No price</span>
                      )}
                    </td>
                    <td className="muted">{l.ingredient.category}</td>
                    <td className="num">
                      <form
                        action={updateRecipeLine}
                        style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}
                      >
                        <input type="hidden" name="line_id" value={l.id} />
                        <input type="hidden" name="code" value={raw} />
                        <input
                          className="cell-input"
                          type="number"
                          step="0.01"
                          name="amount"
                          defaultValue={Number(l.amount)}
                        />
                        <button className="btn btn-sm btn-secondary" type="submit">
                          Save
                        </button>
                      </form>
                    </td>
                    <td className="muted">{l.ingredient.recipe_unit}</td>
                    <td className="num strong">
                      {lc === null ? (
                        <span className="muted">—</span>
                      ) : (
                        money(lc, 3)
                      )}
                    </td>
                    <td></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: "10px 18px", fontSize: 12 }} className="muted">
            Amounts are cooked / plated weights. Line cost applies cooked→raw
            yield and the 0.5oz cheese standard, matching the kitchen rules.
          </div>
        </div>

        {/* Profitability summary */}
        <div className="card">
          <div className="card-head">Profitability</div>
          <div style={{ padding: "14px 18px" }}>
            <form action={updateMealSellPrice} style={{ marginBottom: 16 }}>
              <input type="hidden" name="id" value={meal.id} />
              <input type="hidden" name="code" value={raw} />
              <div className="field">
                <label>Selling Price</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    step="0.01"
                    name="sell_price"
                    defaultValue={meal.sell_price ?? ""}
                    style={{ width: 120 }}
                  />
                  <button className="btn" type="submit">
                    Save
                  </button>
                </div>
              </div>
            </form>

            {cost && (
              <table>
                <tbody>
                  <SummaryRow label="Protein" v={money(cost.protein_cost, 3)} />
                  <SummaryRow label="Carb" v={money(cost.carb_cost, 3)} />
                  <SummaryRow label="Vegetable" v={money(cost.veg_cost, 3)} />
                  <SummaryRow label="Sauce" v={money(cost.sauce_cost, 3)} />
                  <SummaryRow label="Other" v={money(cost.other_cost, 3)} />
                  <SummaryRow label="Food Cost" v={money(cost.food_cost)} strong />
                  <SummaryRow label="Labor" v={money(cost.labor_per_meal)} />
                  <SummaryRow label="Expense" v={money(cost.expense_per_meal)} />
                  <SummaryRow label="Packaging" v={money(cost.packaging_per_meal)} />
                  <SummaryRow label="Total Cost" v={money(cost.total_cost)} strong />
                  <SummaryRow
                    label="Gross Profit"
                    v={cost.cost_complete ? money(cost.gross_profit) : "—"}
                    strong
                  />
                  <SummaryRow
                    label="Margin"
                    v={cost.cost_complete ? pct(cost.margin_pct) : "—"}
                  />
                  <SummaryRow
                    label="Food Cost %"
                    v={cost.cost_complete ? pct(cost.food_cost_pct) : "—"}
                  />
                  <SummaryRow
                    label={`Suggested (${cost.target_margin_pct}% margin)`}
                    v={money(cost.suggested_price)}
                  />
                </tbody>
              </table>
            )}
            {cost && !cost.cost_complete && (
              <div className="note" style={{ marginTop: 14 }}>
                Margins hidden — this recipe has an unpriced ingredient. Add its
                Sysco price on the <a href="/ingredients">Ingredients</a> page.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SummaryRow({
  label,
  v,
  strong,
}: {
  label: string;
  v: string;
  strong?: boolean;
}) {
  return (
    <tr>
      <td className={strong ? "strong" : "muted"}>{label}</td>
      <td className={"num" + (strong ? " strong" : "")}>{v}</td>
    </tr>
  );
}
