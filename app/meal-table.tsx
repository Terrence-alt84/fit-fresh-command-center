"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MealCost, marginTier, money, pct } from "@/lib/types";

type SortKey =
  | "name"
  | "protein_category"
  | "food_cost"
  | "total_cost"
  | "sell_price"
  | "margin_pct"
  | "food_cost_pct"
  | "suggested_price";

function Breakdown({ r }: { r: MealCost }) {
  const segs = [
    { v: r.protein_cost, cls: "seg-protein" },
    { v: r.carb_cost, cls: "seg-carb" },
    { v: r.veg_cost, cls: "seg-veg" },
    { v: r.sauce_cost, cls: "seg-sauce" },
    { v: r.other_cost, cls: "seg-other" },
  ];
  const total = segs.reduce((s, x) => s + Number(x.v), 0) || 1;
  return (
    <div className="breakdown-bar" title="Protein / Carb / Veg / Sauce / Other">
      {segs.map((s, i) => (
        <div
          key={i}
          className={s.cls}
          style={{ width: `${(Number(s.v) / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

export function MealTable({ rows }: { rows: MealCost[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("margin_pct");
  const [asc, setAsc] = useState(false);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [storeOnly, setStoreOnly] = useState(false);
  const [incompleteOnly, setIncompleteOnly] = useState(false);

  const cats = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((r) => r.protein_category)))],
    [rows]
  );

  const filtered = useMemo(() => {
    let out = rows.filter((r) => {
      if (cat !== "All" && r.protein_category !== cat) return false;
      if (storeOnly && !r.is_in_store) return false;
      if (incompleteOnly && r.cost_complete) return false;
      if (q && !`${r.code} ${r.name}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === "string" && typeof bv === "string")
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      return asc ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return out;
  }, [rows, cat, q, storeOnly, incompleteOnly, sortKey, asc]);

  function sortBy(k: SortKey) {
    if (k === sortKey) setAsc(!asc);
    else {
      setSortKey(k);
      setAsc(false);
    }
  }
  const arrow = (k: SortKey) => (sortKey === k ? (asc ? " ▲" : " ▼") : "");

  return (
    <div className="card">
      <div className="card-head">
        <span>Meals ({filtered.length})</span>
      </div>
      <div className="toolbar" style={{ padding: "12px 18px 0" }}>
        <input
          type="text"
          placeholder="Search meal or code…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ minWidth: 200 }}
        />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="muted" style={{ display: "flex", gap: 6 }}>
          <input
            type="checkbox"
            checked={storeOnly}
            onChange={(e) => setStoreOnly(e.target.checked)}
          />
          In-store only
        </label>
        <label className="muted" style={{ display: "flex", gap: 6 }}>
          <input
            type="checkbox"
            checked={incompleteOnly}
            onChange={(e) => setIncompleteOnly(e.target.checked)}
          />
          Incomplete only
        </label>
      </div>
      <div style={{ overflowX: "auto", padding: "10px 0 4px" }}>
        <table>
          <thead>
            <tr>
              <th onClick={() => sortBy("name")} style={{ cursor: "pointer" }}>
                Meal{arrow("name")}
              </th>
              <th
                onClick={() => sortBy("protein_category")}
                style={{ cursor: "pointer" }}
              >
                Category{arrow("protein_category")}
              </th>
              <th
                className="num"
                onClick={() => sortBy("food_cost")}
                style={{ cursor: "pointer" }}
              >
                Food{arrow("food_cost")}
              </th>
              <th>Breakdown</th>
              <th
                className="num"
                onClick={() => sortBy("total_cost")}
                style={{ cursor: "pointer" }}
              >
                Total{arrow("total_cost")}
              </th>
              <th
                className="num"
                onClick={() => sortBy("sell_price")}
                style={{ cursor: "pointer" }}
              >
                Sell{arrow("sell_price")}
              </th>
              <th
                className="num"
                onClick={() => sortBy("margin_pct")}
                style={{ cursor: "pointer" }}
              >
                Margin{arrow("margin_pct")}
              </th>
              <th
                className="num"
                onClick={() => sortBy("food_cost_pct")}
                style={{ cursor: "pointer" }}
              >
                Food %{arrow("food_cost_pct")}
              </th>
              <th
                className="num"
                onClick={() => sortBy("suggested_price")}
                style={{ cursor: "pointer" }}
              >
                Suggested{arrow("suggested_price")}
              </th>
              <th>Tier</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const tier = marginTier(r.cost_complete ? r.margin_pct : null);
              const under =
                r.suggested_price !== null &&
                r.sell_price !== null &&
                r.suggested_price > r.sell_price;
              const code = r.code.replace("#", "");
              return (
                <tr key={r.id}>
                  <td>
                    <Link href={`/meals/${code}`} className="meal-name">
                      {r.name}
                    </Link>
                    <div>
                      <span className="meal-code">{r.code}</span>
                      {r.is_in_store && (
                        <span className="chip chip-store">In-store</span>
                      )}
                      {(r.recipe_estimated || r.recipe_partial) && (
                        <span className="chip chip-flag">
                          {r.recipe_partial ? "Partial" : "Est"}
                        </span>
                      )}
                      {!r.cost_complete && (
                        <span className="chip chip-incomplete">No price</span>
                      )}
                    </div>
                  </td>
                  <td>{r.protein_category}</td>
                  <td className="num strong">{money(r.food_cost)}</td>
                  <td>
                    <Breakdown r={r} />
                  </td>
                  <td className="num">{money(r.total_cost)}</td>
                  <td className="num">{money(r.sell_price)}</td>
                  <td className="num">
                    {r.cost_complete ? pct(r.margin_pct) : "—"}
                  </td>
                  <td className="num">
                    {r.cost_complete ? pct(r.food_cost_pct) : "—"}
                  </td>
                  <td className={"num" + (under ? " underpriced" : "")}>
                    {money(r.suggested_price)}
                  </td>
                  <td>
                    <span className={"badge " + tier.cls}>{tier.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
