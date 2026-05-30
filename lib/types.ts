// Row shapes for the Fit & Fresh Command Center (Phase 1).

export type MealCost = {
  id: string;
  code: string;
  name: string;
  protein_category: string;
  sell_price: number | null;
  is_in_store: boolean;
  recipe_estimated: boolean;
  recipe_partial: boolean;
  active: boolean;
  protein_cost: number;
  carb_cost: number;
  veg_cost: number;
  sauce_cost: number;
  other_cost: number;
  food_cost: number;
  labor_per_meal: number;
  expense_per_meal: number;
  packaging_per_meal: number;
  target_margin_pct: number;
  total_cost: number;
  cost_complete: boolean;
  recipe_lines: number;
  gross_profit: number | null;
  margin_pct: number | null;
  food_cost_pct: number | null;
  suggested_price: number | null;
};

export type Ingredient = {
  id: string;
  key: string;
  name: string;
  category: string;
  order_unit: "lb" | "oz" | "each";
  recipe_unit: "oz" | "each";
  raw_price: number | null;
  yield_factor: number;
  per_each_oz: number | null;
  is_cheese: boolean;
  price_estimated: boolean;
};

export type Meal = {
  id: string;
  code: string;
  name: string;
  protein_category: string;
  sell_price: number | null;
  is_in_store: boolean;
  recipe_estimated: boolean;
  recipe_partial: boolean;
  active: boolean;
};

export type RecipeLine = {
  id: string;
  meal_id: string;
  ingredient_id: string;
  amount: number;
  ingredient: Ingredient;
};

export type CostConstants = {
  id: string;
  labor_per_meal: number;
  expense_per_meal: number;
  packaging_per_meal: number;
  target_margin_pct: number;
  effective_date: string;
};

// Margin tiers — operator framing from the Fit & Fresh cost analysis.
export function marginTier(marginPct: number | null): {
  label: string;
  cls: string;
} {
  if (marginPct === null) return { label: "—", cls: "tier-none" };
  if (marginPct >= 55) return { label: "GOLD", cls: "tier-gold" };
  if (marginPct >= 48) return { label: "SOLID", cls: "tier-solid" };
  return { label: "WATCH", cls: "tier-watch" };
}

export function money(n: number | null | undefined, dp = 2): string {
  if (n === null || n === undefined) return "—";
  return "$" + Number(n).toFixed(dp);
}

export function pct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Number(n).toFixed(1) + "%";
}
