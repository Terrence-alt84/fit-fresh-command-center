import Link from "next/link";
import { notFound } from "next/navigation";
import { loadWeek } from "@/lib/weeks";
import { setWeekItemCount, updateWeek, deleteWeek } from "../actions";
import { money, pct } from "@/lib/types";

export const dynamic = "force-dynamic";

const MEAL_CATEGORIES = [
  "Chicken",
  "Beef",
  "Turkey",
  "Shrimp",
  "Pork",
  "Breakfast",
];

export default async function WeekEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { week, counts, meals } = await loadWeek(id);
  if (!week) notFound();

  const qty = (mid: string) => counts[mid] ?? 0;
  const selected = meals.filter((m) => qty(m.id) > 0);
  const projMeals = selected.reduce((s, m) => s + qty(m.id), 0);
  const revenue = selected.reduce(
    (s, m) => s + qty(m.id) * Number(m.sell_price ?? 0),
    0
  );
  const totalCost = selected.reduce(
    (s, m) => s + qty(m.id) * Number(m.total_cost ?? 0),
    0
  );
  const profit = revenue - totalCost;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : null;

  // Codes lose their leading # in query strings; parseCounts re-adds it.
  const countsParam = selected
    .map((m) => `${m.code.replace("#", "")}:${qty(m.id)}`)
    .join(",");

  return (
    <div>
      <Link href="/weeks" className="back-link">
        ← All weeks
      </Link>
      <div className="page-head">
        <div>
          <h1>Week of {week.week_of}</h1>
          <p>{week.label ?? "Weekly meal-prep menu"}</p>
        </div>
        <form
          action={updateWeek}
          style={{ display: "flex", gap: 8, alignItems: "flex-end" }}
        >
          <input type="hidden" name="id" value={week.id} />
          <input type="hidden" name="week_of" value={week.week_of} />
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Label</label>
            <input type="text" name="label" defaultValue={week.label ?? ""} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select name="status" defaultValue={week.status}>
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" type="submit">
            Save
          </button>
        </form>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="label">Meals on menu</div>
          <div className="value">{selected.length}</div>
        </div>
        <div className="kpi">
          <div className="label">Projected meals</div>
          <div className="value">{projMeals}</div>
        </div>
        <div className="kpi">
          <div className="label">Projected revenue</div>
          <div className="value">{money(revenue)}</div>
        </div>
        <div className="kpi">
          <div className="label">Projected gross profit</div>
          <div className="value">{money(profit)}</div>
          <div className="sub">{pct(marginPct)} margin</div>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="toolbar">
          <span className="muted">Production sheets for this week:</span>
          <Link className="btn btn-sm" href={`/print/crew/8?counts=${countsParam}`}>
            👨‍🍳 Crew sheet
          </Link>
          <Link className="btn btn-sm" href={`/print/order/8?counts=${countsParam}`}>
            🛒 Order sheet
          </Link>
        </div>
      )}

      {MEAL_CATEGORIES.filter((c) =>
        meals.some((m) => m.protein_category === c)
      ).map((cat) => (
        <div className="card" key={cat} style={{ marginBottom: 14 }}>
          <div className="card-head">{cat}</div>
          <table>
            <thead>
              <tr>
                <th>Meal</th>
                <th className="num">Sell</th>
                <th className="num">Margin</th>
                <th>Projected count</th>
              </tr>
            </thead>
            <tbody>
              {meals
                .filter((m) => m.protein_category === cat)
                .map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className="meal-name">{m.name}</span>{" "}
                      <span className="meal-code">{m.code}</span>
                      {m.is_in_store && (
                        <span className="chip chip-store">in-store</span>
                      )}
                      {!m.cost_complete && (
                        <span className="chip chip-incomplete">no price</span>
                      )}
                    </td>
                    <td className="num">{money(m.sell_price)}</td>
                    <td className="num">{pct(m.margin_pct)}</td>
                    <td>
                      <form
                        action={setWeekItemCount}
                        style={{ display: "flex", gap: 6 }}
                      >
                        <input type="hidden" name="week_id" value={week.id} />
                        <input type="hidden" name="meal_id" value={m.id} />
                        <input
                          className="cell-input"
                          type="number"
                          min={0}
                          name="projected_count"
                          defaultValue={counts[m.id] ?? 0}
                        />
                        <button className="btn btn-sm" type="submit">
                          Set
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}

      <form action={deleteWeek} style={{ marginTop: 20 }}>
        <input type="hidden" name="id" value={week.id} />
        <button className="btn btn-secondary btn-sm" type="submit">
          Delete this week
        </button>
      </form>
    </div>
  );
}
