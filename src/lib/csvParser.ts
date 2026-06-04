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
const DESC_HEADERS = ['תיאור', 'description', 'שם בית עסק', 'שם בית העסק', 'פירוט', 'עסק', 'business', 'name', 'מוטב']
const AMOUNT_HEADERS = ['סכום', 'amount', 'סכום חיוב', 'סכום עסקה', 'חיוב', 'sum']
const CREDIT_HEADERS = ['זכות', 'credit', 'הכנסה', 'income']
const DEBIT_HEADERS = ['חובה', 'debit', 'הוצאה', 'expense', 'חיוב']

// ── Date parsing ──────────────────────────────────────────────────────────────

export function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString().slice(0, 10)
  const s = raw.trim()

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // ISO datetime (e.g. from Excel cellDates: "2026-06-02T20:59:20.000Z")
  // Use local date components to avoid UTC timezone shift
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s)
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const dy = String(d.getDate()).padStart(2, '0')
    return `${y}-${mo}-${dy}`
  }

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

// Convert an Excel cell value to a clean string
function cellToString(v: unknown): string {
  if (v instanceof Date) {
    const y = v.getFullYear()
    const mo = String(v.getMonth() + 1).padStart(2, '0')
    const dy = String(v.getDate()).padStart(2, '0')
    return `${y}-${mo}-${dy}`
  }
  return String(v ?? '')
}

// Normalize a header string: strip \r\n, trim, collapse spaces
function normalizeHeader(h: string): string {
  return h.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
}

// Score how "header-like" a row is by counting cells that match known column names
function headerScore(row: unknown[]): number {
  const allPatterns = [...DATE_HEADERS, ...DESC_HEADERS, ...AMOUNT_HEADERS,
    ...CREDIT_HEADERS, ...DEBIT_HEADERS]
  let score = 0
  for (const cell of row) {
    const s = normalizeHeader(String(cell ?? '')).toLowerCase()
    if (s && allPatterns.some((p) => s.includes(p.toLowerCase()))) score++
  }
  return score
}

async function parseExcelFile(file: File): Promise<{ rawHeaders: string[]; rawRows: Record<string, string>[] }> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

  // Collect data rows from ALL sheets, finding the real header in each
  const allRawRows: Record<string, string>[] = []
  let sharedHeaders: string[] | null = null

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    // Use header:1 to get raw arrays so we can find the real header row
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
    if (rawRows.length === 0) continue

    // Find the row with the best header match (scan first 10 rows)
    let headerRowIdx = 0
    let bestScore = 0
    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
      const score = headerScore(rawRows[i])
      if (score > bestScore) { bestScore = score; headerRowIdx = i }
    }

    // Require at least 2 matching header cells
    if (bestScore < 2) continue

    const headerRow = rawRows[headerRowIdx] as unknown[]
    const headers = headerRow.map((h) => normalizeHeader(String(h ?? '')))

    // Use header from first valid sheet; subsequent sheets must share same structure
    if (!sharedHeaders) sharedHeaders = headers

    // Parse data rows after the header
    for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
      const dataRow = rawRows[i] as unknown[]
      // Skip fully empty rows and summary/total rows
      const nonEmpty = dataRow.filter((v) => String(v ?? '').trim() !== '')
      if (nonEmpty.length === 0) continue

      const rowObj: Record<string, string> = {}
      headers.forEach((h, ci) => {
        if (h) rowObj[h] = cellToString(dataRow[ci])
      })
      allRawRows.push(rowObj)
    }
  }

  if (!sharedHeaders || allRawRows.length === 0) return { rawHeaders: [], rawRows: [] }

  return { rawHeaders: sharedHeaders, rawRows: allRawRows }
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
