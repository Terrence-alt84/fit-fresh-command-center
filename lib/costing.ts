import { Ingredient } from "./types";

// Per-ingredient-line cost. Mirrors the meal_cost SQL view exactly:
// cheese forced to 0.5 oz; cooked->raw yield applied; each->lb via per_each_oz.
export function lineCost(ing: Ingredient, amount: number): number | null {
  if (ing.raw_price === null || ing.raw_price === undefined) return null;
  const adj = ing.is_cheese ? 0.5 : amount;
  if (ing.order_unit === "lb") {
    const oz =
      ing.recipe_unit === "each" ? adj * (ing.per_each_oz ?? 1) : adj;
    return (oz * Number(ing.yield_factor)) / 16 * Number(ing.raw_price);
  }
  // order_unit 'oz' or 'each' — priced directly per recipe unit
  return adj * Number(ing.raw_price);
}

export function suggestedPrice(
  totalCost: number,
  targetMarginPct: number
): number | null {
  if (targetMarginPct >= 100) return null;
  const min = totalCost / (1 - targetMarginPct / 100);
  const whole = Math.floor(min);
  return whole + 0.99 >= min ? whole + 0.99 : whole + 1.99;
}
