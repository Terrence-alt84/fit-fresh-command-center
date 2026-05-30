import { getSupabase } from "@/lib/supabase";
import { Ingredient } from "@/lib/types";
import { updateIngredient } from "@/app/actions";

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
