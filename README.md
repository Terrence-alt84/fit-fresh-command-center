# Fit & Fresh Command Center

Phase 1 of the Fit & Fresh Meals operating system: **Recipe Costing** and a
**Meal Profitability** dashboard, grounded in the real Fit & Fresh recipe
library and Sysco price data.

> Scope (Phase 1): recipe costing, meal profitability, ingredient cost
> management, recipe cost calculator, margin analysis.
> **Not** included yet: customer portal, subscriptions, inventory/production
> forecasting, nutrition coaching, AI assistant.

## Tech stack

- **Next.js 15** (App Router, React 19, TypeScript) — server components + server actions
- **Supabase** (Postgres) — data + the `meal_cost` costing view
- **Vercel** — hosting
- Plain hand-written CSS in the Fit & Fresh brand palette (navy `#155A8A`,
  dark navy `#0E4368`, orange `#E07B2C`) — no Tailwind/PostCSS, so the build is
  dependency-light.

## What it does

| Page | Route | Purpose |
|------|-------|---------|
| Meal Profitability | `/` | Sortable/filterable table of every active meal: food cost, cost breakdown by category, total cost, sell price, margin %, food cost %, suggested price, and a GOLD/SOLID/WATCH margin tier. KPI cards on top. |
| Recipe Cost Calculator | `/meals/[code]` | One meal: editable recipe lines with per-line cost, editable sell price, and the full food → total → margin → suggested-price breakdown. |
| Ingredient Cost Management | `/ingredients` | Every ingredient grouped by category; edit Sysco price, cooked→raw yield, and the "estimated price" flag. This is where you fill in the unpriced items. |
| Cost Settings | `/settings` | The per-meal non-food constants (labor `$1.83`, expense `$1.63`, packaging `$0.30`) and the target gross margin that drives suggested prices. Saving creates a new dated version and recalculates every meal. |

### Costing logic

Cost is computed in the `meal_cost` Postgres view (and mirrored in
`lib/costing.ts` for live per-line previews). It faithfully reproduces the
Fit & Fresh kitchen rules:

- Recipe amounts are **cooked / plated** weights.
- **Cooked → raw yield** is applied per ingredient (`yield_factor`), e.g. chicken
  1.33×, rice 0.33×.
- **Cheese is always 0.5 oz** on any topped meal, regardless of the recipe.
- Count-but-buy-by-pound items (sweet potato tots, bacon) convert via
  `per_each_oz`.
- A meal is flagged **cost-incomplete** if any of its ingredients has no price.

`Total cost = food cost + labor + expense + packaging`. Suggested price is the
lowest `$X.99` that hits the target gross margin.

## Project structure

```
fit-fresh-command-center/
├── app/
│   ├── layout.tsx            # shell + top nav
│   ├── nav.tsx               # active-link highlighting (client)
│   ├── globals.css           # brand styling
│   ├── actions.ts            # server actions (update price/recipe/constants)
│   ├── page.tsx              # Meal Profitability dashboard
│   ├── meal-table.tsx        # interactive table (client)
│   ├── meals/[code]/page.tsx # Recipe Cost Calculator (one meal)
│   ├── ingredients/page.tsx  # Ingredient Cost Management
│   └── settings/page.tsx     # Cost Settings
├── lib/
│   ├── supabase.ts           # server-side Supabase client
│   ├── costing.ts            # per-line cost + suggested-price helpers
│   └── types.ts              # row types + formatting/tier helpers
├── package.json
├── tsconfig.json
└── next.config.mjs
```

## Supabase backend

- **Project:** `fit-fresh-command-center` (ref `hwqvaivjstqikfxtbqgj`, region `us-west-1`)
- **URL:** `https://hwqvaivjstqikfxtbqgj.supabase.co`
- **Tables:** `ingredients` (61 rows), `meals` (50), `meal_ingredients` (167),
  `cost_constants` (versioned)
- **View:** `meal_cost` — the live costing/margin roll-up the dashboard reads
- Seeded from the Fit & Fresh `data.py` recipe/cost library.

> **Note:** This is a *separate, clean* project. The older `fitfresh-meals`
> project (ref `asbxtdrcwfdssiztcxer`) is left untouched.

### Configuration

The Supabase URL and publishable key are baked into `lib/supabase.ts` as
defaults (publishable keys are safe to ship; access is governed by RLS), so the
app runs with **zero env config**. To override, set environment variables:

```
SUPABASE_URL=https://hwqvaivjstqikfxtbqgj.supabase.co
SUPABASE_KEY=sb_publishable_...
```

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev      # http://localhost:3000
```

## Deploy to Vercel

This repo is ready for Vercel's Git integration:

1. Push to GitHub (see below).
2. In Vercel → **Add New → Project** → import the repo. Framework auto-detects
   as **Next.js**; no env vars required (they're baked in, or set the two above
   to override).
3. Deploy. Pushes to `main` auto-deploy.

## Authentication

The app is gated by **single-owner login** (Supabase Auth, email + password):

- `middleware.ts` redirects any unauthenticated request to `/login`.
- Server components and server actions use a cookie-aware Supabase client
  (`lib/supabase.ts`), so the database sees the logged-in user and RLS runs as
  the `authenticated` role.
- Sign out from the top-right of the nav bar.

Database access is locked down with RLS: only the `authenticated` role can read
or write. To add another user, create them in Supabase → Authentication → Users.
