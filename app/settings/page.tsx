import { getSupabase } from "@/lib/supabase";
import { CostConstants } from "@/lib/types";
import { updateCostConstants } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("cost_constants")
    .select("*")
    .order("effective_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const c = data as CostConstants | null;

  const nonFood = c
    ? Number(c.labor_per_meal) +
      Number(c.expense_per_meal) +
      Number(c.packaging_per_meal)
    : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Cost Settings</h1>
          <p>Per-meal non-food costs &amp; the target margin that drives suggested prices</p>
        </div>
      </div>

      <div style={{ maxWidth: 480 }}>
        <div className="card">
          <div className="card-head">
            <span>Per-Meal Constants</span>
            <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>
              Non-food total: <strong>${nonFood.toFixed(2)}</strong>
            </span>
          </div>
          <form action={updateCostConstants} style={{ padding: "16px 18px" }}>
            <div className="field">
              <label>Labor per meal ($)</label>
              <input
                type="number"
                step="0.01"
                name="labor_per_meal"
                defaultValue={c ? Number(c.labor_per_meal) : 1.83}
              />
            </div>
            <div className="field">
              <label>Expense per meal ($)</label>
              <input
                type="number"
                step="0.01"
                name="expense_per_meal"
                defaultValue={c ? Number(c.expense_per_meal) : 1.63}
              />
            </div>
            <div className="field">
              <label>Packaging per meal ($)</label>
              <input
                type="number"
                step="0.01"
                name="packaging_per_meal"
                defaultValue={c ? Number(c.packaging_per_meal) : 0.3}
              />
            </div>
            <div className="field">
              <label>Target gross margin (%) — drives suggested price</label>
              <input
                type="number"
                step="0.5"
                name="target_margin_pct"
                defaultValue={c ? Number(c.target_margin_pct) : 55}
              />
            </div>
            <button className="btn" type="submit">
              Save (new version)
            </button>
            <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
              Saving creates a new dated version and recalculates every meal&apos;s
              margin and suggested price.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
