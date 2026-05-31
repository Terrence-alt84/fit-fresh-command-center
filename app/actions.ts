"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";

function num(v: FormDataEntryValue | null): number | null {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function updateIngredient(formData: FormData) {
  const id = String(formData.get("id"));
  const raw_price = num(formData.get("raw_price"));
  const yield_factor = num(formData.get("yield_factor")) ?? 1;
  const price_estimated = formData.get("price_estimated") === "on";

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("ingredients")
    .update({
      raw_price,
      yield_factor,
      price_estimated,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/ingredients");
  revalidatePath("/");
}

export async function updateMealSellPrice(formData: FormData) {
  const id = String(formData.get("id"));
  const sell_price = num(formData.get("sell_price"));

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("meals")
    .update({ sell_price, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  const code = formData.get("code");
  if (code) revalidatePath(`/meals/${code}`);
  revalidatePath("/");
}

export async function updateRecipeLine(formData: FormData) {
  const lineId = String(formData.get("line_id"));
  const amount = num(formData.get("amount"));
  const code = formData.get("code");

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("meal_ingredients")
    .update({ amount })
    .eq("id", lineId);
  if (error) throw new Error(error.message);

  if (code) revalidatePath(`/meals/${code}`);
  revalidatePath("/");
}

export async function updateCostConstants(formData: FormData) {
  const labor_per_meal = num(formData.get("labor_per_meal")) ?? 0;
  const expense_per_meal = num(formData.get("expense_per_meal")) ?? 0;
  const packaging_per_meal = num(formData.get("packaging_per_meal")) ?? 0;
  const target_margin_pct = num(formData.get("target_margin_pct")) ?? 55;

  // Versioned: insert a new current row rather than mutating history.
  const supabase = await getSupabase();
  const { error } = await supabase.from("cost_constants").insert({
    labor_per_meal,
    expense_per_meal,
    packaging_per_meal,
    target_margin_pct,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function createIngredient(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const category = String(formData.get("category") || "Other");
  const order_unit = String(formData.get("order_unit") || "lb");
  const recipe_unit = String(formData.get("recipe_unit") || "oz");
  const raw_price = num(formData.get("raw_price"));
  const yield_factor = num(formData.get("yield_factor")) ?? 1;
  const per_each_oz = num(formData.get("per_each_oz"));
  const is_cheese = formData.get("is_cheese") === "on";
  const station = parseInt(String(formData.get("station") || "5"), 10) || 5;

  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "ingredient";

  const supabase = await getSupabase();
  let key = base;
  for (let i = 2; i < 50; i++) {
    const { data } = await supabase
      .from("ingredients")
      .select("id")
      .eq("key", key)
      .maybeSingle();
    if (!data) break;
    key = `${base}_${i}`;
  }

  const { error } = await supabase.from("ingredients").insert({
    key,
    name,
    category,
    order_unit,
    recipe_unit,
    raw_price,
    yield_factor,
    per_each_oz,
    is_cheese,
    station,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/ingredients");
}

export async function addRecipeLine(formData: FormData) {
  const meal_id = String(formData.get("meal_id"));
  const ingredient_id = String(formData.get("ingredient_id"));
  const amount = num(formData.get("amount"));
  const code = formData.get("code");
  if (!meal_id || !ingredient_id || amount === null) return;
  const supabase = await getSupabase();
  // upsert so re-adding an ingredient updates its amount instead of erroring
  const { error } = await supabase
    .from("meal_ingredients")
    .upsert(
      { meal_id, ingredient_id, amount },
      { onConflict: "meal_id,ingredient_id" }
    );
  if (error) throw new Error(error.message);
  if (code) revalidatePath(`/meals/${code}`);
  revalidatePath("/");
}

export async function removeRecipeLine(formData: FormData) {
  const line_id = String(formData.get("line_id"));
  const code = formData.get("code");
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("meal_ingredients")
    .delete()
    .eq("id", line_id);
  if (error) throw new Error(error.message);
  if (code) revalidatePath(`/meals/${code}`);
  revalidatePath("/");
}
