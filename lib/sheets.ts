import { getSupabase } from "./supabase";

// ---------------------------------------------------------------------------
// Shared data layer for the printable kitchen sheets (pull / order / crew).
// All quantities computed live from recipes + yields, cheese forced to 0.5 oz.
// ---------------------------------------------------------------------------

export type Cat =
  | "Protein"
  | "Grain/Starch"
  | "Vegetable"
  | "Cheese"
  | "Sauce"
  | "Wrap/Bread"
  | "Egg/Dairy"
  | "Other";

export const CATEGORY_ORDER: Cat[] = [
  "Protein",
  "Grain/Starch",
  "Vegetable",
  "Cheese",
  "Sauce",
  "Wrap/Bread",
  "Egg/Dairy",
  "Other",
];

// Crew COOK page fire order (longest-cook first).
export const FIRE_ORDER: { cat: Cat; station: string }[] = [
  { cat: "Grain/Starch", station: "1 · Rice / Noodles / Potatoes" },
  { cat: "Protein", station: "2 · Proteins" },
  { cat: "Vegetable", station: "3 · Vegetables" },
  { cat: "Sauce", station: "4 · Sauces" },
  { cat: "Cheese", station: "5 · Cheese / Pack" },
  { cat: "Egg/Dairy", station: "6 · Egg / Dairy" },
  { cat: "Wrap/Bread", station: "7 · Wraps / Bread" },
  { cat: "Other", station: "8 · Other" },
];

export type Unit = "lb" | "oz" | "each";

export type Ing = {
  id: string;
  name: string;
  category: Cat;
  order_unit: Unit;
  recipe_unit: "oz" | "each";
  yield_factor: number;
  per_each_oz: number | null;
  is_cheese: boolean;
  raw_price: number | null;
};

export type Line = { amount: number; ingredient: Ing };

export type Meal = {
  id: string;
  code: string;
  name: string;
  protein_category: string;
  is_in_store: boolean;
  recipe_estimated: boolean;
  recipe_partial: boolean;
  lines: Line[];
};

export type PullRow = {
  ingredientId: string;
  category: Cat;
  name: string;
  unit: Unit;
  raw: number; // order-unit amount to pull (raw/dry)
  cooked: number; // order-unit amount cooked/plated
  flagged: boolean; // appears in an estimated/partial recipe
  unpriced: boolean;
};

// Load active meals with their recipe lines + ingredient attributes.
export async function loadMeals(inStoreOnly: boolean): Promise<Meal[]> {
  const supabase = await getSupabase();
  let query = supabase
    .from("meals")
    .select(
      "id, code, name, protein_category, is_in_store, recipe_estimated, recipe_partial, " +
        "meal_ingredients(amount, ingredient:ingredients(id, name, category, order_unit, recipe_unit, yield_factor, per_each_oz, is_cheese, raw_price))"
    )
    .eq("active", true);
  if (inStoreOnly) query = query.eq("is_in_store", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as RawMeal[]).map((m) => ({
    id: m.id,
    code: m.code,
    name: m.name,
    protein_category: m.protein_category,
    is_in_store: m.is_in_store,
    recipe_estimated: m.recipe_estimated,
    recipe_partial: m.recipe_partial,
    lines: (m.meal_ingredients ?? []).map((l) => ({
      amount: Number(l.amount),
      ingredient: l.ingredient,
    })),
  }));
}

type RawMeal = {
  id: string;
  code: string;
  name: string;
  protein_category: string;
  is_in_store: boolean;
  recipe_estimated: boolean;
  recipe_partial: boolean;
  meal_ingredients: { amount: number; ingredient: Ing }[] | null;
};

// Raw/dry amount to pull, in the ingredient's order unit (lb returns lb).
export function rawOrderAmount(i: Ing, recipeAmount: number): number {
  const adj = i.is_cheese ? 0.5 : recipeAmount;
  if (i.order_unit === "lb") {
    const oz = i.recipe_unit === "each" ? adj * (i.per_each_oz ?? 1) : adj;
    return (oz * Number(i.yield_factor)) / 16;
  }
  return adj; // oz and each are stored as cooked/plated == order unit
}

// Cooked/plated amount, in the ingredient's order unit (lb returns lb).
export function cookedAmount(i: Ing, recipeAmount: number): number {
  const adj = i.is_cheese ? 0.5 : recipeAmount;
  if (i.order_unit === "lb") {
    const oz = i.recipe_unit === "each" ? adj * (i.per_each_oz ?? 1) : adj;
    return oz / 16;
  }
  return adj;
}

// Aggregate pull needs across a batch (qtyByCode = { "#7": 8, ... }).
export function aggregatePull(
  meals: Meal[],
  qtyByCode: Record<string, number>
): PullRow[] {
  const map = new Map<string, PullRow>();
  for (const m of meals) {
    const qty = qtyByCode[m.code] ?? 0;
    if (qty <= 0) continue;
    const flagged = m.recipe_estimated || m.recipe_partial;
    for (const l of m.lines) {
      const i = l.ingredient;
      const row = map.get(i.id) ?? {
        ingredientId: i.id,
        category: i.category,
        name: i.name,
        unit: i.order_unit,
        raw: 0,
        cooked: 0,
        flagged: false,
        unpriced: i.raw_price === null,
      };
      row.raw += qty * rawOrderAmount(i, l.amount);
      row.cooked += qty * cookedAmount(i, l.amount);
      if (flagged) row.flagged = true;
      map.set(i.id, row);
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      a.name.localeCompare(b.name)
  );
}

// "16 lb 11 oz" / "32 oz" / "24 ct"
export function fmt(amount: number, unit: Unit): string {
  if (unit === "lb") {
    const o = Math.round(amount * 16);
    const lb = Math.floor(o / 16);
    const oz = o - lb * 16;
    if (lb && oz) return `${lb} lb ${oz} oz`;
    return lb ? `${lb} lb` : `${oz} oz`;
  }
  if (unit === "oz") return `${Math.round(amount)} oz`;
  return `${Math.round(amount)} ct`;
}

// Build-line bullets for the crew BUILD page, e.g. "4 oz Chicken breast".
export function buildLines(m: Meal): string[] {
  return m.lines
    .slice()
    .sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a.ingredient.category) -
        CATEGORY_ORDER.indexOf(b.ingredient.category)
    )
    .map((l) => {
      const i = l.ingredient;
      const amt = i.is_cheese ? 0.5 : l.amount;
      if (i.recipe_unit === "each") return `${amt} ${i.name}`;
      return `${amt} oz ${i.name}`;
    });
}

// In-store meal codes -> qty map for N of each.
export function inStoreQty(meals: Meal[], perMeal: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of meals) if (m.is_in_store) out[m.code] = perMeal;
  return out;
}
