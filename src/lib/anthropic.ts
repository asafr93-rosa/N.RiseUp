import Anthropic from '@anthropic-ai/sdk'
import type { ExpenseCategory } from '../store/useFinanceStore'
import type { ParsedRow } from './csvParser'
// Single source of truth for agent-category → app-category mapping.
// All CSV import flows must use this mapping exclusively.
import AGENT_CATEGORY_MAP from './agentCategoryMap.json'
// Merchants that must always be excluded from import previews, regardless of Claude's output.
import EXCLUDED_MERCHANTS from './excludedMerchants.json'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
    if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set')
    client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  }
  return client
}

const HEBREW_TO_APP = AGENT_CATEGORY_MAP as Record<string, ExpenseCategory>

export function isSuggestedExclusion(description: string): boolean {
  const lower = description.toLowerCase()
  return (EXCLUDED_MERCHANTS as string[]).some(m => lower.includes(m.toLowerCase()))
}

const CLASSIFIER_SYSTEM_PROMPT = `You are an expert financial transaction processor for Israeli credit card and bank statements.
Your task: parse the raw file content, extract all expense transactions, classify each into a Hebrew category, and return ONLY a CSV.

## Output format — 4 columns, no other content:
תאריך,תיאור ההוצאה,סכום ההוצאה,הקטגורייה

- תאריך: transaction date in YYYY-MM-DD format (extract from the data; if missing use today)
- תיאור ההוצאה: merchant/description name, cleaned up
- סכום ההוצאה: positive ILS amount (use the ILS charge amount column if multiple currencies exist)
- הקטגורייה: exactly one of: מזון | תחבורה | חשבונות | מנויים | פנאי | ציוד לבית | בריאות | שונות

## Categories:
- חשבונות: electricity, water, gas, phone/internet bills, arnona, HOA fees
- מנויים: recurring digital subscriptions — Spotify, Apple iCloud/TV, ChatGPT/OpenAI, Netflix, Disney+, Microsoft 365
- מזון: supermarkets, restaurants, cafés, food delivery (Wolt, 10bis), bakeries
- תחבורה: fuel stations, parking, taxis, public transit, Uber, toll roads
- בריאות: pharmacies, doctors, clinics, Kupat Holim, health insurance
- פנאי: cinema, events, travel, hotels, sports, leisure (NOT streaming)
- ציוד לבית: home appliances, furniture, hardware stores, home improvement
- שונות: anything else

## Rules:
- Skip ALL non-transaction rows: titles, subtitles, totals, summaries, legal text, empty rows
- Exclude zero/negative amounts
- If amount is in foreign currency, use the ILS equivalent column
- Output ONLY the CSV — no explanation, no markdown, no summary
- Remove any double-quote characters (\") from merchant names (e.g. רמב"ם → רמב״ם or רמבם)`

function parseClassifiedCSV(csv: string): ParsedRow[] {
  const lines = csv.trim().split('\n').map(l => l.trim()).filter(Boolean)
  const rows: ParsedRow[] = []

  for (const line of lines) {
    if (line.startsWith('תאריך,')) continue

    const fields: string[] = []
    let field = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (!inQuotes && field === '') { inQuotes = true }           // opening quote
        else if (inQuotes && line[i + 1] === '"') { field += '"'; i++ } // escaped quote
        else if (inQuotes) { inQuotes = false }                     // closing quote
        else { field += c }                                          // stray quote inside field — keep as text
      } else if (c === ',' && !inQuotes) {
        fields.push(field.trim()); field = ''
      } else {
        field += c
      }
    }
    fields.push(field.trim())

    if (fields.length < 4) {
      console.warn('[CSV] skipped (<4 fields):', line)
      continue
    }
    const date = fields[0]
    const hebrewCategory = fields[fields.length - 1]
    const rawAmount = fields[fields.length - 2]
    const description = fields.slice(1, fields.length - 2).join(', ')
    const amount = parseFloat(rawAmount.replace(/[,\s₪+]/g, ''))
    if (!description || isNaN(amount) || amount <= 0) {
      console.warn('[CSV] skipped (bad amount/desc):', { line, description, rawAmount, amount })
      continue
    }

    rows.push({
      date: date || new Date().toISOString().slice(0, 10),
      description,
      amount,
      type: 'expense',
      category: HEBREW_TO_APP[hebrewCategory] ?? 'other',
    })
  }
  console.log(`[CSV] parsed ${rows.length} rows from ${lines.length} lines`)
  return rows
}

export async function classifyTransactionsFromFile(fileContent: string): Promise<ParsedRow[]> {
  const c = getClient()
  const response = await c.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    system: CLASSIFIER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Process this file and return the classified CSV:\n\n${fileContent}` }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return parseClassifiedCSV(text)
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function askAdvisor(
  messages: ChatMessage[],
  financialContext: string
): Promise<string> {
  const c = getClient()
  const response = await c.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a personal financial advisor with access to the user's financial data. Be concise, practical, and speak in the same language the user uses. Here is their current financial snapshot:\n\n${financialContext}`,
    messages,
  })
  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
}

export function isApiKeyConfigured(): boolean {
  return Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY)
}
