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
  station: number;
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
  station: number; // cook fire-order station (1-5)
};

// Load active meals with their recipe lines + ingredient attributes.
export async function loadMeals(inStoreOnly: boolean): Promise<Meal[]> {
  const supabase = await getSupabase();
  let query = supabase
    .from("meals")
    .select(
      "id, code, name, protein_category, is_in_store, recipe_estimated, recipe_partial, " +
        "meal_ingredients(amount, ingredient:ingredients(id, name, category, order_unit, recipe_unit, yield_factor, per_each_oz, is_cheese, raw_price, station))"
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
// xpByCode adds Extra-Protein plates: +2 oz to each meal's first Protein line.
export function aggregatePull(
  meals: Meal[],
  qtyByCode: Record<string, number>,
  xpByCode: Record<string, number> = {}
): PullRow[] {
  const map = new Map<string, PullRow>();
  const rowFor = (i: Ing): PullRow => {
    const row = map.get(i.id) ?? {
      ingredientId: i.id,
      category: i.category,
      name: i.name,
      unit: i.order_unit,
      raw: 0,
      cooked: 0,
      flagged: false,
      unpriced: i.raw_price === null,
      station: i.station,
    };
    map.set(i.id, row);
    return row;
  };
  for (const m of meals) {
    const qty = qtyByCode[m.code] ?? 0;
    if (qty <= 0) continue;
    const flagged = m.recipe_estimated || m.recipe_partial;
    for (const l of m.lines) {
      const row = rowFor(l.ingredient);
      row.raw += qty * rawOrderAmount(l.ingredient, l.amount);
      row.cooked += qty * cookedAmount(l.ingredient, l.amount);
      if (flagged) row.flagged = true;
    }
    // Extra Protein: +2 oz (cooked, pre-yield) per XP plate to the first protein.
    const xp = xpByCode[m.code] ?? 0;
    if (xp > 0) {
      const pl = firstProteinLine(m);
      if (pl) {
        const row = rowFor(pl.ingredient);
        row.raw += rawOrderAmount(pl.ingredient, 2 * xp);
        row.cooked += cookedAmount(pl.ingredient, 2 * xp);
      }
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

// ---------------------------------------------------------------------------
// Spec additions: meal categories, 5-station fire order, XP, blank mode, inputs
// ---------------------------------------------------------------------------

export const MEAL_CATEGORIES = [
  "Chicken",
  "Beef",
  "Turkey",
  "Shrimp",
  "Pork",
  "Breakfast",
];

// Crew COOK page: 5 stations in fire order (spec §2), driven by the
// ingredients.station column (1-5). Each row carries its station.
export const STATIONS: { n: number; label: string }[] = [
  { n: 1, label: "1 · Rice & Noodles" },
  { n: 2, label: "2 · Proteins" },
  { n: 3, label: "3 · Potatoes & Roast" },
  { n: 4, label: "4 · Vegetables" },
  { n: 5, label: "5 · Sauce, Cheese & Pack" },
];

// First Protein-category line of a meal (deterministic) — the XP +2oz target.
export function firstProteinLine(m: Meal): Line | null {
  return (
    m.lines
      .filter((l) => l.ingredient.category === "Protein")
      .sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name))[0] ??
    null
  );
}

// Every ingredient (for the blank / standby weekly order template).
export async function loadAllIngredients(): Promise<Ing[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("ingredients")
    .select(
      "id, name, category, order_unit, recipe_unit, yield_factor, per_each_oz, is_cheese, raw_price, station"
    );
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Ing[]).slice().sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      a.name.localeCompare(b.name)
  );
}

// Parse "7:8,40:5" (meal codes lose their leading # in query strings) -> {"#7":8,...}
export function parseCounts(raw: string | undefined | null): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw) return out;
  for (const part of raw.split(",")) {
    const [rawCode, q] = part.split(":");
    if (!rawCode) continue;
    const code = rawCode.trim().startsWith("#")
      ? rawCode.trim()
      : "#" + rawCode.trim();
    const n = parseInt((q ?? "").trim(), 10);
    if (Number.isFinite(n) && n > 0) out[code] = n;
  }
  return out;
}
