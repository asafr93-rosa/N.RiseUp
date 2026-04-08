# N.RiseUp — Personal Finance Management Tool
## Product Requirements Document

---

## Overview

N.RiseUp is a fully client-side personal finance management web app. All data persists in the browser via `localStorage`. No backend, no account required. Currency is ILS (₪) only.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 + TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| State | Zustand v5 + `persist` middleware → `localStorage` |
| Routing | React Router v7 |
| Charts | Recharts v3 |
| Icons | lucide-react |
| CSV Parsing | papaparse |
| Date utils | date-fns |
| Animations | @formkit/auto-animate + custom RAF counter |
| Drag-and-drop | @dnd-kit/core + @dnd-kit/sortable |
| Notifications | react-hot-toast |

---

## Design Language

### Color Palette

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| surface | `#FFFFFF` | `#0D1117` |
| card | `#F5F5F7` | `#161B22` |
| border | `#E5E7EB` | `#30363D` |
| text-primary | `#1A1A2E` | `#E6EDF3` |
| text-secondary | `#6B7280` | `#8B949E` |
| accent | `#4361EE` | `#4361EE` |
| income | `#22C55E` | `#22C55E` |
| expense | `#EF4444` | `#EF4444` |

### Principles
- Mobile-first — all content fits in viewport, sections scroll independently
- White/light default with optional dark mode (toggled by user, persisted)
- Clean font: Inter (system-ui fallback)
- No hover-only interactions (must work on touch)
- Amount inputs use `inputMode="decimal"`
- Confirm before any destructive action

---

## Navigation

Bottom tab bar with 4 tabs:

| # | Tab | Icon | Route |
|---|-----|------|-------|
| 1 | Home | LayoutDashboard | `/` |
| 2 | Accounts | CreditCard | `/accounts` |
| 3 | Assets | Building2 | `/assets` |
| 4 | Investments | TrendingUp | `/investments` |

---

## Tab 1: Home (Dashboard)

### Top — Net Worth Summary
- **Total Net Worth** — large hero number (animated counter)
- 3 sub-totals: Bank Balances total | Assets total | Investments total

### Middle — Spending Insights (Current Month)
- Month navigation (← MMMM YYYY →)
- Total expenses this month (animated counter)
- Category breakdown cards — each shows:
  - Icon (lucide-react) + category name
  - Amount in ₪
  - % change vs previous month (green ↑ / red ↓ arrow)
- Comparison vs previous month summary

### Bottom — Chart Widgets (Customizable)
- "Add Chart" button → modal with:
  - Step 1: Chart type — Bar / Pie / Line (visual tile selector)
  - Step 2: Data source — Expenses by category / Expenses by month / Balance over time / Category comparison
  - Step 3: Filters — category filter + account filter (optional)
  - Step 4: Time range — 1M / 3M / 6M / 1Y / All + custom title input
- Widgets displayed in a responsive grid
- Drag-and-drop reordering (@dnd-kit)
- Delete button (×) on each widget
- All widget configs persist in localStorage

---

## Tab 2: Accounts

### Bank Account List
- Card per account: bank name | last 4 digits | current balance
- "Add Account" → form: bank name, account number (last 4), initial balance
- Click account → Edit / Delete / Update balance
- Deleting account cascades to all its transactions and import batches

### Add Expense / Income
- Button → modal form:
  - Date (date input)
  - Amount (decimal keyboard)
  - Type: Expense / Income (toggle)
  - Category (dropdown, 11 options — expenses only)
  - Description (free text)
  - Associated bank account (select)

### Import CSV
Pipeline: Upload → Auto-detect → (Map columns if needed) → Preview → Confirm

1. **Upload**: drag-and-drop or file picker, accepts `.csv`
2. **Auto-detect**: tries UTF-8 then Windows-1255 (Hebrew); auto-maps column headers
3. **Column mapper**: shown if headers can't be auto-detected — user assigns: date / business name / amount
4. **Preview table**: each row shows date, description, amount, category badge (auto-categorized). User can override category per row via dropdown.
5. **Confirm**: calls `addTransactionsBatch` — atomic state update

### Expense View
- Filters: month picker | category select | account select
- Sortable table: date | description | category badge | account | amount
- Summary row: Total Expenses | Total Income | Net

---

## Tab 3: Assets

### Asset Cards
Each card shows:
- Asset name + type badge (Apartment / Land / Vehicle / Other)
- Estimated current value (₪)
- Purchase date + original cost
- Profit/loss chip: `+₪X (Y%)` in green or `-₪X (Y%)` in red

### Add / Edit Asset
Form fields:
- Asset name (text)
- Type: Residential property / Investment property / Land / Vehicle / Other
- Estimated current value (₪)
- Purchase date
- Original purchase cost (₪)
- Notes (textarea)

### Summary Section
- Total asset value (animated hero)
- Profit/loss vs total original cost
- Pie chart breakdown by type (Recharts PieChart)

---

## Tab 4: Investments

### Investment Cards
Each card shows:
- Investment name + type badge
- Current value (₪, animated)
- Monthly contribution (if > 0)
- Management fees line: `X% contribution / Y% accumulation`
- Managing institution
- Edit / Delete actions

### Add / Edit Investment
Form fields:
- Investment name
- Type: Pension fund / Education fund (Keren Hishtalmut) / Provident fund / Investment portfolio / Deposit / Savings / Mutual fund / Other
- Current value (₪)
- Monthly contribution (₪)
- Management fee — contribution % (separate input)
- Management fee — accumulation % (separate input)
- Managing institution (text)
- Description / Notes (textarea)
- Opening date

### Summary Section
- Total investments value (animated hero)
- Pie chart by investment type (Recharts)
- Estimated annual management fees (calculated):
  `(currentValue × accumulationPct / 100) + (monthlyContribution × 12 × contributionPct / 100)`

---

## Data Model

### BankAccount
```typescript
{ id, name, lastFourDigits, balance: number, createdAt }
```

### Transaction
```typescript
{
  id, date, amount, type: 'expense' | 'income',
  category: ExpenseCategory, categorySource: 'keyword' | 'user' | 'manual',
  description, bankAccountId, importBatchId: string | null, createdAt
}
```

### ExpenseCategory (11 types)
```
food_restaurants | fuel_transportation | insurance | shopping_fashion | health |
education | entertainment_leisure | housing | household_bills | taxes | other
```

### ImportBatch
```typescript
{ id, bankAccountId, fileName, transactionCount, totalAmount, importedAt }
```

### Asset
```typescript
{ id, name, type: AssetType, estimatedValue, purchaseDate, originalPurchaseCost, notes, createdAt }
```

### Investment
```typescript
{
  id, name, type: InvestmentType, currentValue, monthlyContribution,
  managementFeeContributionPct, managementFeeAccumulationPct,
  managingInstitution, description, openingDate, createdAt
}
```

### ChartWidget
```typescript
{
  id, chartType: 'bar' | 'pie' | 'line',
  dataSource: 'expenses_by_category' | 'expenses_by_month' | 'balance_over_time' | 'category_comparison',
  timeRange: '1m' | '3m' | '6m' | '1y' | 'all',
  filterCategory: ExpenseCategory | 'all', filterAccountId: string | null,
  title, order
}
```

---

## Cross-Cutting Logic

### Net Worth
`netWorth = Σ accounts.balance + Σ assets.estimatedValue + Σ investments.currentValue`

### CSV Auto-Categorization Keywords (Hebrew)
| Category | Keywords |
|----------|---------|
| food_restaurants | סופרסל, רמי לוי, יוחננוף, מגה, ויקטורי, וולט, תן ביס, מסעדה, קפה, מקדונלד, סטארבקס |
| fuel_transportation | דלק, סונול, פז, דור אלון, גט, יאנגו, מונית, אגד, רכבת, רב קו, uber |
| insurance | ביטוח, פניקס, הראל, מגדל, כלל, מנורה |
| shopping_fashion | זארה, H&M, mango, castro, גולף, fox, terminal x, נייקי, אדידס |
| health | מכבי, כללית, לאומית, בית חולים, super-pharm, נובו |
| education | שכר לימוד, אוניברסיטה, מכללה, קורס, חוג |
| entertainment_leisure | נטפליקס, spotify, yes planet, rav chen, הופעה |
| housing | שכר דירה, משכנתא, ועד בית |
| household_bills | חשמל, מים, גז, בזק, פרטנר, גולן, icloud |
| taxes | מס הכנסה, ביטוח לאומי, מע"מ |
| other | (fallback) |

User corrections to auto-categorized transactions are saved as learned rules for future imports.

---

## Storage
- Zustand `persist` middleware → `localStorage` key: `nriseup-state-v1`
- Sample data seeded on first load (empty state)
- Field migration guards in `onRehydrateStorage`

---

## Development Phases

| Phase | Deliverable |
|-------|-------------|
| 0 | PRD.md + project scaffold + config + CSS tokens |
| 1 | Zustand store + all TypeScript interfaces + lib utilities |
| 2 | BottomNav + TopBar + ThemeToggle + UI primitives |
| 3 | Tab 3: Assets (CRUD pattern baseline) |
| 4 | Tab 4: Investments |
| 5 | Tab 2: Accounts + CSV import pipeline |
| 6 | Tab 1: Home Dashboard + chart widgets + DnD |
| 7 | Polish: empty states, animations, toasts, build check |
