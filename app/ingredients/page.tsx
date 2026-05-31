import { getSupabase } from "@/lib/supabase";
import { Ingredient } from "@/lib/types";
import { updateIngredient, createIngredient } from "@/app/actions";

const STATIONS = [
  { n: 1, label: "1 · Rice & Noodles" },
  { n: 2, label: "2 · Proteins" },
  { n: 3, label: "3 · Potatoes & Roast" },
  { n: 4, label: "4 · Vegetables" },
  { n: 5, label: "5 · Sauce / Cheese / Pack" },
];

export const dynamic = "force-dynamic";

const CATEGORY_ORDER = [
  "Protein",
  "Grain/Starch",
  "Vegetable",
  "Cheese",
  "Sauce",
  "Wrap/Bread",
  "Egg/Dairy",
  "Other",
];

export default async function IngredientsPage() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .order("name");

  if (error) return <div className="note">Error: {error.message}</div>;
  const all = (data ?? []) as Ingredient[];
  const unpriced = all.filter((i) => i.raw_price === null).length;

  const byCat = CATEGORY_ORDER.map((c) => ({
    cat: c,
    items: all.filter((i) => i.category === c),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ingredient Cost Management</h1>
          <p>
            {all.length} ingredients · Sysco $/order-unit · yield = cooked→raw
            factor
          </p>
        </div>
      </div>

      {unpriced > 0 && (
        <div className="note">
          {unpriced} ingredients have no price yet. Fill in the Sysco cost to
          unlock costing for the meals that use them.
        </div>
      )}

      <details className="card" style={{ marginBottom: 18 }}>
        <summary
          className="card-head"
          style={{ cursor: "pointer", listStyle: "revert" }}
        >
          + Add ingredient
        </summary>
        <form
          action={createIngredient}
          style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}
        >
          <div className="field" style={{ marginBottom: 0, minWidth: 200 }}>
            <label>Name</label>
            <input type="text" name="name" placeholder="e.g. Black beans" required />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Category</label>
            <select name="category" defaultValue="Protein">
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Order unit (how you buy)</label>
            <select name="order_unit" defaultValue="lb">
              <option value="lb">lb</option>
              <option value="oz">oz</option>
              <option value="each">each</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Recipe unit</label>
            <select name="recipe_unit" defaultValue="oz">
              <option value="oz">oz</option>
              <option value="each">each</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Sysco $ / unit</label>
            <input className="cell-input" type="number" step="0.0001" name="raw_price" placeholder="—" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Yield (cooked→raw)</label>
            <input className="cell-input" type="number" step="0.0001" name="yield_factor" defaultValue={1} style={{ width: 80 }} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Cook station</label>
            <select name="station" defaultValue={5}>
              {STATIONS.map((s) => (
                <option key={s.n} value={s.n}>{s.label}</option>
              ))}
            </select>
          </div>
          <label className="muted" style={{ display: "flex", gap: 5, fontSize: 12, paddingBottom: 8 }}>
            <input type="checkbox" name="is_cheese" /> cheese (force 0.5 oz)
          </label>
          <button className="btn" type="submit">Add ingredient</button>
        </form>
      </details>

      {byCat.map((g) => (
        <div className="card" key={g.cat} style={{ marginBottom: 18 }}>
          <div className="card-head">{g.cat}</div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Order Unit</th>
                  <th>Recipe Unit</th>
                  <th className="num">Sysco $ / unit</th>
                  <th className="num">Yield</th>
                  <th>Est?</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((i) => (
                  <tr key={i.id}>
                    <td className="meal-name">
                      {i.name}
                      {i.is_cheese && (
                        <span className="chip chip-flag">0.5oz std</span>
                      )}
                      {i.raw_price === null && (
                        <span className="chip chip-incomplete">No price</span>
                      )}
                    </td>
                    <td className="muted">{i.order_unit}</td>
                    <td className="muted">{i.recipe_unit}</td>
                    <td className="num" colSpan={4}>
                      <form
                        action={updateIngredient}
                        style={{
                          display: "flex",
                          gap: 8,
                          justifyContent: "flex-end",
                          alignItems: "center",
                        }}
                      >
                        <input type="hidden" name="id" value={i.id} />
                        <input
                          className="cell-input"
                          type="number"
                          step="0.0001"
                          name="raw_price"
                          defaultValue={i.raw_price ?? ""}
                          placeholder="—"
                        />
                        <input
                          className="cell-input"
                          type="number"
                          step="0.0001"
                          name="yield_factor"
                          defaultValue={Number(i.yield_factor)}
                          style={{ width: 72 }}
                          title="Cooked→raw factor"
                        />
                        <label
                          className="muted"
                          style={{ display: "flex", gap: 4, fontSize: 12 }}
                        >
                          <input
                            type="checkbox"
                            name="price_estimated"
                            defaultChecked={i.price_estimated}
                          />
                          est
                        </label>
                        <button className="btn btn-sm" type="submit">
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}
