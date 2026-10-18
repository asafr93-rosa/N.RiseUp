// POST /api/sync-cal — signs in to Cal (Visa Cal) and returns this month's charges, classified.
//
// Vercel env vars (Project → Settings → Environment Variables):
//   CAL_USERNAME, CAL_PASSWORD   Cal login
//   CAL_SYNC_SECRET              passcode the app must send (x-sync-secret header)
//   ANTHROPIC_API_KEY or VITE_ANTHROPIC_API_KEY   for classification (optional)
//
// Body: { month?: 'YYYY-MM', card?: '1234', categories: string[] }
//   `categories` are the Hebrew category names (from src/lib/agentCategoryMap.json, sent by the app
//   so the map has a single source of truth). Category mapping + merchant exclusion happen in the app.

import { timingSafeEqual } from 'node:crypto'
import chromium from '@sparticuz/chromium'
import { CompanyTypes, createScraper } from 'israeli-bank-scrapers-core'
import Anthropic from '@anthropic-ai/sdk'

interface SyncRow {
  date: string
  description: string
  amount: number
  category: string
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

function secretMatches(given: string | null, expected: string): boolean {
  if (!given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function classify(descriptions: string[], categories: string[]): Promise<string[]> {
  const fallback = categories.includes('שונות') ? 'שונות' : categories[categories.length - 1]
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey || descriptions.length === 0) return descriptions.map(() => fallback)
  try {
    const client = new Anthropic({ apiKey })
    const msg = await client.messages.create({
      model: 'claude-haiku-5-5',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content:
          `Classify each Israeli credit-card merchant into exactly one of these categories: ${categories.join(', ')}.\n` +
          `Return ONLY a JSON array of category strings, same order and length as the input.\n\n` +
          JSON.stringify(descriptions),
      }],
    })
    const text = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
    const parsed = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1)) as unknown[]
    return descriptions.map((_, i) => (typeof parsed[i] === 'string' && categories.includes(parsed[i] as string) ? parsed[i] as string : fallback))
  } catch {
    return descriptions.map(() => fallback)
  }
}

export async function POST(request: Request): Promise<Response> {
  const { CAL_USERNAME, CAL_PASSWORD, CAL_SYNC_SECRET } = process.env
  const missing = (['CAL_USERNAME', 'CAL_PASSWORD', 'CAL_SYNC_SECRET'] as const).filter((k) => !process.env[k])
  if (!CAL_USERNAME || !CAL_PASSWORD || !CAL_SYNC_SECRET) {
    return json(500, { error: `Cal sync is not configured on the server. Missing in Vercel (Production): ${missing.join(', ')}` })
  }
  if (!secretMatches(request.headers.get('x-sync-secret'), CAL_SYNC_SECRET)) {
    return json(401, { error: 'Wrong sync passcode.' })
  }

  let body: { month?: string; card?: string; categories?: string[] }
  try { body = await request.json() } catch { body = {} }
  const categories = Array.isArray(body.categories) && body.categories.length > 0 ? body.categories : ['שונות']

  const now = new Date()
  const [year, month] = /^\d{4}-\d{2}$/.test(body.month ?? '')
    ? body.month!.split('-').map(Number)
    : [now.getFullYear(), now.getMonth() + 1]
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59)

  const scraper = createScraper({
    companyId: CompanyTypes.visaCal,
    startDate: monthStart,
    combineInstallments: false,
    executablePath: await chromium.executablePath(),
    args: chromium.args,
    defaultTimeout: 60000,
  })

  let result
  try {
    result = await scraper.scrape({ username: CAL_USERNAME, password: CAL_PASSWORD })
  } catch (err) {
    return json(502, { error: `Cal sign-in crashed: ${(err as Error).message}` })
  }
  if (!result.success) {
    return json(502, { error: `Cal sign-in failed: ${result.errorType ?? 'unknown'}${result.errorMessage ? ` — ${result.errorMessage}` : ''}` })
  }

  const accounts = result.accounts ?? []
  const lastFour = (n: string) => String(n ?? '').replace(/\D/g, '').slice(-4)
  const cards = accounts.map((a) => lastFour(a.accountNumber))
  const account = body.card ? accounts.find((a) => lastFour(a.accountNumber) === body.card) : accounts[0]
  if (!account) return json(404, { error: 'No matching card found in Cal.', cards })

  const rows = (account.txns ?? [])
    .filter((t) => { const d = new Date(t.date); return d >= monthStart && d <= monthEnd })
    .map((t) => ({
      date: t.date.slice(0, 10),
      description: String(t.description ?? '').trim(),
      // Charges are negative; refunds/credits positive — keep charges only
      amount: -(t.chargedAmount ?? t.originalAmount ?? 0),
    }))
    .filter((r) => r.description && r.amount > 0)
    // Card fee and cashback are never imported
    .filter((r) => !/דמי כרטיס|החזר|זיכוי|cashcal/i.test(r.description))

  const classified = await classify(rows.map((r) => r.description), categories)
  const out: SyncRow[] = rows.map((r, i) => ({ ...r, category: classified[i] }))

  return json(200, {
    card: lastFour(account.accountNumber),
    cards,
    month: `${year}-${String(month).padStart(2, '0')}`,
    rows: out,
  })
}
