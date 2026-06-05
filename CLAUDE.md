# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server
npm run build     # tsc type-check + vite build (run before every commit)
npm run lint      # eslint
npm run preview   # preview production build locally
```

No test suite. TypeScript strict mode is enforced — `npm run build` is the verification step.

## Stack

- React 19 + Vite 8 + TypeScript 6 (strict, `noUnusedLocals`, `noUnusedParameters`)
- Tailwind CSS v4 via `@tailwindcss/vite` — **no `tailwind.config.js`**, all tokens defined in `src/index.css` under `@theme`
- Zustand v5 + `persist` middleware → `localStorage` key `nriseup-state-v1`
- React Router v7, Recharts v3, lucide-react, @dnd-kit, date-fns, papaparse, react-hot-toast, @formkit/auto-animate

## Architecture

**Single store** at `src/store/useFinanceStore.ts` — all TypeScript interfaces and all state live here. When adding a new field:
1. Add to the interface
2. Implement the action in the `create()` call
3. Add a migration guard in `onRehydrateStorage` (called once on app load)

`onRehydrateStorage` also seeds sample data on first load and syncs the persisted theme to `document.documentElement.dataset.theme`.

**4 pages** (`src/pages/`) map to 4 routes: `/` Home, `/accounts`, `/assets`, `/investments`. Each page composes feature components from `src/components/[feature]/`.

**Shared UI primitives** in `src/components/ui/`: `Button`, `Input`, `Modal`, `Badge`, `AnimatedCounter`, `ConfirmDialog`, `Skeleton`. Use these — don't create alternatives.

**Lib utilities** in `src/lib/`:
- `formatters.ts` — `formatCurrency` (uses `Intl.NumberFormat('he-IL')`), `formatDate`, `formatCompact`, `formatPercent`, plus `CATEGORY_LABELS`, `CATEGORY_COLORS`, `INVESTMENT_TYPE_LABELS`, `ASSET_TYPE_COLORS` maps
- `categorizer.ts` — `categorizeByKeyword(name, userRules)` → `ExpenseCategory`; keyword dictionary covers Israeli vendors in Hebrew + English
- `chartHelpers.ts` — pure functions that transform store data into Recharts-ready arrays; `rangeFromTimeRange` converts a `ChartTimeRange` to `{from, to, months}`
- `csvParser.ts` — `parseCSVFile(file, userRules)` handles UTF-8 + Windows-1255 (Hebrew bank exports via `TextDecoder`), returns `ParseResult` with `needsMapping` flag

## Design System

**Light/dark mode** — toggled by `updateTheme()` in the store, which writes to `document.documentElement.dataset.theme`. CSS variables in `src/index.css` switch via `html[data-theme="dark"]`. Never hardcode colors; always use CSS variables or the token constants from `formatters.ts`.

Key color tokens:
- `var(--color-surface)` / `var(--color-card)` / `var(--color-border)`
- `var(--color-text-primary)` / `var(--color-text-secondary)`
- `var(--color-accent)` `#4361EE` · `var(--color-income)` `#22C55E` · `var(--color-expense)` `#EF4444`

**Mobile-first** — all content must fit in viewport; inner sections scroll independently. Amount inputs must use `inputMode="decimal"`. Confirm before any destructive action (`ConfirmDialog`). Never use hover-only states for interactive controls.

**List animations** — wrap list containers with `useAutoAnimate<HTMLDivElement>()` from `@formkit/auto-animate/react`.

## Data Model Notes

- `Transaction.amount` is always a **positive number** — `type: 'expense' | 'income'` determines the sign in the UI
- `Transaction.categorySource`: `'keyword'` = auto-categorized from CSV, `'user'` = overridden by user (also saves to `categoryRules`), `'manual'` = typed in manually
- `deleteAccount` cascades to all linked transactions and importBatches
- `deleteImportBatch` cascades to all transactions with that `importBatchId`
- Net worth is computed in components: `Σ accounts.balance + Σ assets.estimatedValue + Σ investments.currentValue`
- Annual investment fee formula: `(currentValue × accumulationPct / 100) + (monthlyContribution × 12 × contributionPct / 100)`

## Deployment

Vercel project `n-riseup` (asafr93-8298s-projects). GitHub repo `asafr93-rosa/N.RiseUp` on `main` — Vercel auto-deploys on push.
