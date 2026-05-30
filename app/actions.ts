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

  const supabase = getSupabase();
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

  const supabase = getSupabase();
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

  const supabase = getSupabase();
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
  const supabase = getSupabase();
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
