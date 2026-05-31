"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export async function createWeek(formData: FormData) {
  const week_of = String(formData.get("week_of") || "");
  const label = String(formData.get("label") || "").trim() || null;
  if (!week_of) return;
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("weekly_menus")
    .insert({ week_of, label })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/weeks");
  redirect(`/weeks/${data.id}`);
}

export async function setWeekItemCount(formData: FormData) {
  const week_id = String(formData.get("week_id"));
  const meal_id = String(formData.get("meal_id"));
  const count = Math.max(
    0,
    parseInt(String(formData.get("projected_count") || "0"), 10) || 0
  );
  const supabase = await getSupabase();
  if (count <= 0) {
    const { error } = await supabase
      .from("weekly_menu_items")
      .delete()
      .eq("week_id", week_id)
      .eq("meal_id", meal_id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("weekly_menu_items")
      .upsert(
        { week_id, meal_id, projected_count: count },
        { onConflict: "week_id,meal_id" }
      );
    if (error) throw new Error(error.message);
  }
  revalidatePath(`/weeks/${week_id}`);
}

export async function updateWeek(formData: FormData) {
  const id = String(formData.get("id"));
  const label = String(formData.get("label") || "").trim() || null;
  const status = String(formData.get("status") || "draft");
  const week_of = String(formData.get("week_of") || "");
  const supabase = await getSupabase();
  const patch: Record<string, unknown> = { label, status };
  if (week_of) patch.week_of = week_of;
  const { error } = await supabase
    .from("weekly_menus")
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/weeks/${id}`);
  revalidatePath("/weeks");
}

export async function deleteWeek(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await getSupabase();
  const { error } = await supabase.from("weekly_menus").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/weeks");
  redirect("/weeks");
}
