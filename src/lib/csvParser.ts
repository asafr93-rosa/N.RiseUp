import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { categorizeByKeyword } from './categorizer'
import type { ExpenseCategory, CategoryRules } from '../store/useFinanceStore'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedRow {
  date: string         // ISO YYYY-MM-DD
  description: string
  amount: number       // positive number
  type: 'expense' | 'income'
  category: ExpenseCategory
}

export interface ParseResult {
  rows: ParsedRow[]
  needsMapping: boolean
  rawHeaders: string[]
  rawRows: Record<string, string>[]
}

export type ColumnKey = 'date' | 'description' | 'amount' | 'credit' | 'debit'

export interface ColumnMapping {
  date: string
  description: string
  amount: string       // single amount column (can be negative)
  credit?: string      // optional: separate credit column
  debit?: string       // optional: separate debit column
}

// ── Known Hebrew/English header patterns ─────────────────────────────────────

const DATE_HEADERS = ['תאריך', 'date', 'תאריך עסקה', 'תאריך חיוב', 'transaction date']
const DESC_HEADERS = ['תיאור', 'description', 'שם בית עסק', 'פירוט', 'עסק', 'business', 'name', 'מוטב']
const AMOUNT_HEADERS = ['סכום', 'amount', 'סכום חיוב', 'סכום עסקה', 'חיוב', 'sum']
const CREDIT_HEADERS = ['זכות', 'credit', 'הכנסה', 'income']
const DEBIT_HEADERS = ['חובה', 'debit', 'הוצאה', 'expense', 'חיוב']

// ── Date parsing ──────────────────────────────────────────────────────────────

export function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString().slice(0, 10)
  const s = raw.trim()

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // DD/MM/YYYY or DD.MM.YYYY
  const dmy = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    const year = y.length === 2 ? `20${y}` : y
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdy) {
    const [, m, d, y] = mdy
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return new Date().toISOString().slice(0, 10)
}

// ── Amount parsing ────────────────────────────────────────────────────────────

function parseAmount(raw: string): number {
  if (!raw) return 0
  // Remove currency symbols and thousands separators, handle negative parens
  const cleaned = raw
    .replace(/[₪$€£,\s]/g, '')
    .replace(/\((.+)\)/, '-$1')
    .trim()
  return Math.abs(parseFloat(cleaned) || 0)
}

function isNegative(raw: string): boolean {
  const cleaned = raw.replace(/[₪$€£,\s]/g, '').trim()
  return cleaned.startsWith('-') || /\(.+\)/.test(raw)
}

// ── Header auto-detection ─────────────────────────────────────────────────────

function detectColumn(headers: string[], candidates: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase().trim())
  for (const candidate of candidates) {
    const idx = lower.findIndex((h) => h.includes(candidate.toLowerCase()))
    if (idx !== -1) return headers[idx]
  }
  return null
}

function autoDetectMapping(headers: string[]): ColumnMapping | null {
  const date = detectColumn(headers, DATE_HEADERS)
  const description = detectColumn(headers, DESC_HEADERS)
  const amount = detectColumn(headers, AMOUNT_HEADERS)
  const credit = detectColumn(headers, CREDIT_HEADERS)
  const debit = detectColumn(headers, DEBIT_HEADERS)

  if (!date || !description) return null
  if (!amount && !credit && !debit) return null

  return {
    date,
    description,
    amount: amount ?? '',
    credit: credit ?? undefined,
    debit: debit ?? undefined,
  }
}

// ── Build ParsedRow from a raw row + mapping ──────────────────────────────────

function buildRow(
  raw: Record<string, string>,
  mapping: ColumnMapping,
  userRules: CategoryRules
): ParsedRow | null {
  const dateStr = raw[mapping.date] ?? ''
  const descStr = raw[mapping.description] ?? ''

  let amount = 0
  let type: 'expense' | 'income' = 'expense'

  if (mapping.credit && mapping.debit) {
    const creditVal = parseAmount(raw[mapping.credit] ?? '')
    const debitVal = parseAmount(raw[mapping.debit] ?? '')
    if (creditVal > 0) {
      amount = creditVal
      type = 'income'
    } else {
      amount = debitVal
      type = 'expense'
    }
  } else if (mapping.amount) {
    const raw_amount = raw[mapping.amount] ?? ''
    amount = parseAmount(raw_amount)
    type = isNegative(raw_amount) ? 'income' : 'expense'
  }

  if (!descStr || amount === 0) return null

  return {
    date: parseDate(dateStr),
    description: descStr.trim(),
    amount,
    type,
    category: categorizeByKeyword(descStr, userRules),
  }
}

// ── Main parser ───────────────────────────────────────────────────────────────

export async function parseCSVFile(
  file: File,
  userRules: CategoryRules = {}
): Promise<ParseResult> {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel'

  let rawHeaders: string[]
  let rawRows: Record<string, string>[]

  if (isExcel) {
    const parsed = await parseExcelFile(file)
    rawHeaders = parsed.rawHeaders
    rawRows = parsed.rawRows
  } else {
    const text = await tryDecode(file)
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    })
    rawHeaders = result.meta.fields ?? []
    rawRows = result.data
  }

  const mapping = autoDetectMapping(rawHeaders)

  if (!mapping) {
    return { rows: [], needsMapping: true, rawHeaders, rawRows }
  }

  const rows = rawRows
    .map((r) => buildRow(r, mapping, userRules))
    .filter((r): r is ParsedRow => r !== null)

  return { rows, needsMapping: false, rawHeaders, rawRows }
}

export function applyMapping(
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
  userRules: CategoryRules = {}
): ParsedRow[] {
  return rawRows
    .map((r) => buildRow(r, mapping, userRules))
    .filter((r): r is ParsedRow => r !== null)
}

// ── Excel parser ──────────────────────────────────────────────────────────────

async function parseExcelFile(file: File): Promise<{ rawHeaders: string[]; rawRows: Record<string, string>[] }> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  if (data.length === 0) return { rawHeaders: [], rawRows: [] }

  const rawHeaders = Object.keys(data[0])
  const rawRows = data.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => {
        if (v instanceof Date) {
          const iso = v.toISOString().slice(0, 10)
          return [k, iso]
        }
        return [k, String(v)]
      })
    ) as Record<string, string>
  )

  return { rawHeaders, rawRows }
}

// ── Encoding helper ───────────────────────────────────────────────────────────

async function tryDecode(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()

  // Check for UTF-8 BOM
  const bytes = new Uint8Array(buffer)
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(buffer)
  }

  // Try UTF-8 — if it contains replacement chars, fall back to Windows-1255
  const utf8 = new TextDecoder('utf-8').decode(buffer)
  if (utf8.includes('\uFFFD')) {
    try {
      return new TextDecoder('windows-1255').decode(buffer)
    } catch {
      return utf8
    }
  }

  return utf8
}
