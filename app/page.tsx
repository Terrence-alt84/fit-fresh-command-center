import { getSupabase } from "@/lib/supabase";
import { MealCost } from "@/lib/types";
import { MealTable } from "./meal-table";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("meal_cost")
    .select("*")
    .eq("active", true);

  if (error) {
    return (
      <div className="note">Could not load meals: {error.message}</div>
    );
  }

  const rows = (data ?? []) as MealCost[];
  const priced = rows.filter(
    (r) => r.cost_complete && r.margin_pct !== null
  );
  const avgMargin =
    priced.length > 0
      ? priced.reduce((s, r) => s + (r.margin_pct ?? 0), 0) / priced.length
      : null;
  const avgFoodPct =
    priced.length > 0
      ? priced.reduce((s, r) => s + (r.food_cost_pct ?? 0), 0) / priced.length
      : null;
  const underpriced = rows.filter(
    (r) =>
      r.suggested_price !== null &&
      r.sell_price !== null &&
      r.suggested_price > r.sell_price
  ).length;
  const incomplete = rows.filter((r) => !r.cost_complete).length;
  const constants = rows[0];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Meal Profitability</h1>
          <p>
            {rows.length} active meals · costing grounded in the Fit &amp; Fresh
            recipe library &amp; Sysco prices
          </p>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="label">Avg Margin</div>
          <div className="value">
            {avgMargin === null ? "—" : avgMargin.toFixed(1) + "%"}
          </div>
          <div className="sub">{priced.length} fully-costed meals</div>
        </div>
        <div className="kpi">
          <div className="label">Avg Food Cost %</div>
          <div className="value">
            {avgFoodPct === null ? "—" : avgFoodPct.toFixed(1) + "%"}
          </div>
          <div className="sub">food ÷ sell price</div>
        </div>
        <div className="kpi">
          <div className="label">Non-Food / Meal</div>
          <div className="value">
            $
            {constants
              ? (
                  Number(constants.labor_per_meal) +
                  Number(constants.expense_per_meal) +
                  Number(constants.packaging_per_meal)
                ).toFixed(2)
              : "—"}
          </div>
          <div className="sub">labor + expense + packaging</div>
        </div>
        <div className="kpi">
          <div className="label">Underpriced</div>
          <div className="value" style={{ color: "var(--orange)" }}>
            {underpriced}
          </div>
          <div className="sub">below {constants?.target_margin_pct ?? 55}% target</div>
        </div>
        <div className="kpi">
          <div className="label">Cost Incomplete</div>
          <div className="value">{incomplete}</div>
          <div className="sub">missing ingredient prices</div>
        </div>
      </div>

      {incomplete > 0 && (
        <div className="note">
          {incomplete} meals can&apos;t be fully costed yet because some
          ingredients have no Sysco price (eggs, bacon, sausage, grits, wings,
          tortillas…). Add prices on the{" "}
          <a href="/ingredients">Ingredients</a> page to light them up.
        </div>
      )}

      <MealTable rows={rows} />
    </>
  );
}
