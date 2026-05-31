import { getSupabase } from "./supabase";
import { MealCost } from "./types";

export type Week = {
  id: string;
  week_of: string;
  label: string | null;
  status: string;
  created_at: string;
};

export type WeekSummary = Week & {
  meals: number;
  projectedMeals: number;
  revenue: number;
  profit: number;
};

type ItemRow = { week_id: string; meal_id: string; projected_count: number };
type CostRow = {
  id: string;
  sell_price: number | null;
  total_cost: number | null;
  gross_profit: number | null;
};

export async function loadWeeks(): Promise<WeekSummary[]> {
  const supabase = await getSupabase();
  const { data: weeks, error } = await supabase
    .from("weekly_menus")
    .select("*")
    .order("week_of", { ascending: false });
  if (error) throw new Error(error.message);
  const list = (weeks ?? []) as unknown as Week[];
  if (!list.length) return [];

  const { data: itemsData } = await supabase
    .from("weekly_menu_items")
    .select("week_id, meal_id, projected_count");
  const { data: costData } = await supabase
    .from("meal_cost")
    .select("id, sell_price, total_cost, gross_profit");

  const items = (itemsData ?? []) as unknown as ItemRow[];
  const costs = (costData ?? []) as unknown as CostRow[];
  const costById = new Map(costs.map((c) => [c.id, c]));

  const agg = new Map<
    string,
    { meals: number; projectedMeals: number; revenue: number; profit: number }
  >();
  for (const it of items) {
    if (it.projected_count <= 0) continue;
    const a =
      agg.get(it.week_id) ??
      { meals: 0, projectedMeals: 0, revenue: 0, profit: 0 };
    const c = costById.get(it.meal_id);
    a.meals += 1;
    a.projectedMeals += it.projected_count;
    if (c) {
      a.revenue += it.projected_count * Number(c.sell_price ?? 0);
      a.profit += it.projected_count * Number(c.gross_profit ?? 0);
    }
    agg.set(it.week_id, a);
  }

  return list.map((w) => ({
    ...w,
    ...(agg.get(w.id) ?? { meals: 0, projectedMeals: 0, revenue: 0, profit: 0 }),
  }));
}

export async function loadWeek(id: string): Promise<{
  week: Week | null;
  counts: Record<string, number>;
  meals: MealCost[];
}> {
  const supabase = await getSupabase();
  const { data: weekData } = await supabase
    .from("weekly_menus")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const { data: itemsData } = await supabase
    .from("weekly_menu_items")
    .select("meal_id, projected_count")
    .eq("week_id", id);
  const { data: mealsData } = await supabase
    .from("meal_cost")
    .select("*")
    .eq("active", true)
    .order("protein_category");

  const counts: Record<string, number> = {};
  for (const it of (itemsData ?? []) as unknown as {
    meal_id: string;
    projected_count: number;
  }[]) {
    counts[it.meal_id] = it.projected_count;
  }

  return {
    week: (weekData as unknown as Week) ?? null,
    counts,
    meals: (mealsData ?? []) as unknown as MealCost[],
  };
}
