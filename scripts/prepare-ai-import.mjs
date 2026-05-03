import { readFileSync, writeFileSync } from 'fs'
import { resolve, basename, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')

// Single source of truth
const require = createRequire(import.meta.url)
const AGENT_CATEGORY_MAP = require('../src/lib/agentCategoryMap.json')
const EXCLUDED_MERCHANTS = require('../src/lib/excludedMerchants.json')


function parseCSVLine(line) {
  const result = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { field += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(field)
      field = ''
    } else {
      field += char
    }
  }
  result.push(field)
  return result
}

const csvPath = resolve(process.argv[2])
const filename = basename(csvPath)

// Strip UTF-8 BOM and parse
const raw = readFileSync(csvPath, 'utf-8').replace(/^﻿/, '')
const lines = raw.trim().split('\n').map(l => l.trim()).filter(Boolean)

if (lines.length < 2) {
  console.error('No data rows found in CSV.')
  process.exit(1)
}

// Extract statement date from filename
// Patterns: visa_2385_03.05.26.csv → 2026-05-03
//           mastercard_7153_05.26.csv → 2026-05-01
let statementDate = new Date().toISOString().slice(0, 10)
const fullDateMatch = filename.match(/(\d{2})\.(\d{2})\.(\d{2})/)
const monthYearMatch = filename.match(/_(\d{2})\.(\d{2})\.csv/)
if (fullDateMatch) {
  const [, dd, mm, yy] = fullDateMatch
  statementDate = `20${yy}-${mm}-${dd}`
} else if (monthYearMatch) {
  const [, mm, yy] = monthYearMatch
  statementDate = `20${yy}-${mm}-01`
}

// Extract card last 4 digits from filename
const cardMatch = filename.match(/_(\d{4})[_.]/)
const cardLastFour = cardMatch?.[1] ?? ''

// Parse transactions (skip header row)
const transactions = []
let excluded = 0

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i])
  const description = (fields[0] ?? '').trim()
  const amount = parseFloat((fields[1] ?? '').replace(/,/g, ''))
  const hebrewCategory = (fields[2] ?? '').trim()

  if (!description || isNaN(amount) || amount <= 0) continue

  // Exclude merchants from shared list (src/lib/excludedMerchants.json)
  const descLower = description.toLowerCase()
  const isExcluded = EXCLUDED_MERCHANTS.some(m => descLower.includes(m.toLowerCase()))
  if (isExcluded) { excluded++; continue }

  const category = AGENT_CATEGORY_MAP[hebrewCategory] ?? 'other'

  transactions.push({
    date: statementDate,
    description,
    amount,
    type: 'expense',
    category,
    categorySource: 'keyword',
    bankAccountId: null,
    creditCardId: null,
    importBatchId: null,
  })
}

const output = {
  transactions,
  sourceFile: filename,
  cardLastFour,
  statementDate,
  createdAt: new Date().toISOString(),
}

const outputPath = resolve(PROJECT_ROOT, 'public/pending-import.json')
writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')

console.log(`✓ Queued ${transactions.length} transactions → public/pending-import.json`)
console.log(`  Card: ···· ${cardLastFour || '????'} | Date: ${statementDate} | Excluded (recurring): ${excluded}`)
