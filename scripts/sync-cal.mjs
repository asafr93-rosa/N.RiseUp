// Sync Cal (Visa Cal) credit card transactions straight into the app's import banner.
//
// One-time setup (run in the project folder):
//   npm i --no-save israeli-bank-scrapers
//   Add to .env (gitignored):  CAL_USERNAME=...  CAL_PASSWORD=...
//
// Usage:
//   npm run sync:cal                  → current month, first card found
//   npm run sync:cal -- --card 2385   → a specific card
//   npm run sync:cal -- --month 2026-09
//   npm run sync:cal -- --show        → show the browser window (use if Cal asks for an SMS code)
//
// Flow: Cal → classify (Claude, 8 Hebrew categories) → Categories/<card>.csv → prepare-ai-import.mjs
//       → public/pending-import.json → open the app (npm run dev) → Accounts → import banner.

import { existsSync, readdirSync, unlinkSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const CATEGORIES_DIR = resolve(PROJECT_ROOT, 'Categories')
const require = createRequire(import.meta.url)
const AGENT_CATEGORY_MAP = require('../src/lib/agentCategoryMap.json')
const HEBREW_CATEGORIES = Object.keys(AGENT_CATEGORY_MAP)
const FALLBACK_CATEGORY = 'שונות'

// ── Args & env ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const argValue = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const wantedCard = argValue('--card')
const monthArg = argValue('--month')
const showBrowser = args.includes('--show')

const envPath = resolve(PROJECT_ROOT, '.env')
if (existsSync(envPath)) process.loadEnvFile(envPath)

const { CAL_USERNAME, CAL_PASSWORD } = process.env
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY

if (!CAL_USERNAME || !CAL_PASSWORD) {
  console.error('✗ Missing CAL_USERNAME / CAL_PASSWORD in .env')
  console.error('  Add them to the .env file in the project folder (it is gitignored).')
  process.exit(1)
}

let scrapers
try {
  scrapers = await import('israeli-bank-scrapers')
} catch {
  console.error('✗ israeli-bank-scrapers is not installed. Run once:')
  console.error('    npm i --no-save israeli-bank-scrapers')
  process.exit(1)
}
const { CompanyTypes, createScraper } = scrapers

// ── Month window ──────────────────────────────────────────────────────────────
const now = new Date()
const [year, month] = monthArg
  ? monthArg.split('-').map(Number)
  : [now.getFullYear(), now.getMonth() + 1]
if (!year || !month || month < 1 || month > 12) {
  console.error(`✗ Bad --month "${monthArg}". Use YYYY-MM, e.g. 2026-09`)
  process.exit(1)
}
const monthStart = new Date(year, month - 1, 1)
const monthEnd = new Date(year, month, 0, 23, 59, 59)
const monthKey = `${year}-${String(month).padStart(2, '0')}`

// ── Scrape ────────────────────────────────────────────────────────────────────
console.log(`→ Signing in to Cal and fetching ${monthKey}…${showBrowser ? ' (browser visible)' : ''}`)
const scraper = createScraper({
  companyId: CompanyTypes.visaCal,
  startDate: monthStart,
  combineInstallments: false,
  showBrowser,
  verbose: false,
})
const result = await scraper.scrape({ username: CAL_USERNAME, password: CAL_PASSWORD })

if (!result.success) {
  console.error(`✗ Cal sign-in/scrape failed: ${result.errorType ?? 'unknown'} ${result.errorMessage ?? ''}`)
  if (!showBrowser) console.error('  If Cal asked for an SMS code, retry with --show and complete it in the window.')
  process.exit(1)
}

const accounts = result.accounts ?? []
if (accounts.length === 0) {
  console.error('✗ No cards returned by Cal.')
  process.exit(1)
}
const lastFour = (acc) => String(acc.accountNumber ?? '').replace(/\D/g, '').slice(-4)
console.log(`  Cards found: ${accounts.map((a) => `···· ${lastFour(a)} (${a.txns?.length ?? 0} txns)`).join(', ')}`)

const account = wantedCard ? accounts.find((a) => lastFour(a) === wantedCard) : accounts[0]
if (!account) {
  console.error(`✗ Card ···· ${wantedCard} not found.`)
  process.exit(1)
}
const card = lastFour(account)

// ── Filter: this month's charges only (pending "עסקה בקליטה" included) ─────────
const inMonth = (iso) => {
  const d = new Date(iso)
  return d >= monthStart && d <= monthEnd
}
const rows = (account.txns ?? [])
  .filter((t) => inMonth(t.date))
  .map((t) => ({
    description: String(t.description ?? '').trim(),
    // Charges are negative in the scraper; refunds/credits positive. Keep charges only.
    amount: -(t.chargedAmount ?? t.originalAmount ?? 0),
  }))
  .filter((r) => r.description && r.amount > 0)
  // Card fee and cashback are excluded by spec
  .filter((r) => !/דמי כרטיס|החזר|זיכוי|cashcal/i.test(r.description))

if (rows.length === 0) {
  console.log(`✓ No charges on card ···· ${card} for ${monthKey}. Nothing to import.`)
  process.exit(0)
}
console.log(`  Card ···· ${card}: ${rows.length} charges in ${monthKey}`)

// ── Classify into the 8 Hebrew categories ─────────────────────────────────────
async function classify(descriptions) {
  if (!ANTHROPIC_KEY) {
    console.warn('  ! No Anthropic API key in .env — everything goes to "שונות". You can recategorize in the app.')
    return descriptions.map(() => FALLBACK_CATEGORY)
  }
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: ANTHROPIC_KEY })
  const prompt =
    `Classify each Israeli credit-card merchant into exactly one of these categories: ${HEBREW_CATEGORIES.join(', ')}.\n` +
    `Return ONLY a JSON array of category strings, same order and length as the input.\n\n` +
    JSON.stringify(descriptions)
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-5-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
    const parsed = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1))
    return descriptions.map((_, i) => (HEBREW_CATEGORIES.includes(parsed[i]) ? parsed[i] : FALLBACK_CATEGORY))
  } catch (err) {
    console.warn(`  ! Classification failed (${err.message}) — using "שונות". You can recategorize in the app.`)
    return descriptions.map(() => FALLBACK_CATEGORY)
  }
}

console.log('→ Classifying…')
const categories = await classify(rows.map((r) => r.description))

// ── Write classified CSV (one file per card) ──────────────────────────────────
mkdirSync(CATEGORIES_DIR, { recursive: true })
for (const f of readdirSync(CATEGORIES_DIR)) {
  if (f.includes(`_${card}_`) && f.endsWith('.csv')) unlinkSync(resolve(CATEGORIES_DIR, f))
}
const dd = String(now.getDate()).padStart(2, '0')
const fileDate = `${dd}.${String(month).padStart(2, '0')}.${String(year).slice(-2)}`
const csvPath = resolve(CATEGORIES_DIR, `cal_${card}_${fileDate}.csv`)
const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
const csv = ['description,amount,category', ...rows.map((r, i) => [esc(r.description), r.amount.toFixed(2), esc(categories[i])].join(','))].join('\n')
writeFileSync(csvPath, '﻿' + csv, 'utf-8')
console.log(`✓ Saved ${csvPath.replace(PROJECT_ROOT + '/', '')}`)

// ── Queue for the app import banner ───────────────────────────────────────────
execFileSync(process.execPath, [resolve(__dirname, 'prepare-ai-import.mjs'), csvPath], { stdio: 'inherit' })
console.log('\nNext: run `npm run dev`, open the app → Accounts → click Import on the banner.')
