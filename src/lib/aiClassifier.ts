import Anthropic from '@anthropic-ai/sdk'
import type { ExpenseCategory } from '../store/useFinanceStore'

const CATEGORY_OPTIONS: ExpenseCategory[] = [
  'food_restaurants',
  'grocery',
  'fuel_transportation',
  'household_bills',
  'subscriptions',
  'entertainment_leisure',
  'housing',
  'health',
  'insurance',
  'shopping_fashion',
  'education',
  'taxes',
  'pets',
  'other',
]

const CATEGORY_DESCRIPTIONS: Record<ExpenseCategory, string> = {
  food_restaurants: 'Restaurants, cafes, delivery apps (Wolt, Ten Bis)',
  grocery: 'Supermarkets and grocery stores (Shufersal, Rami Levy, Yochananof, etc.)',
  fuel_transportation: 'Fuel stations, public transit, taxi, ride-hailing, parking',
  household_bills: 'Electricity, water, gas, municipal tax (arnona), internet, phone bills',
  subscriptions: 'Streaming services, software subscriptions, memberships (monthly/annual)',
  entertainment_leisure: 'Cinema, concerts, games, gym, sports, parks, leisure activities',
  housing: 'Rent, home appliances, furniture, home improvement, IKEA',
  health: 'Pharmacy, doctors, clinics, health funds (kupat holim), dental, optical',
  insurance: 'Insurance premiums — car, life, property (not health funds)',
  shopping_fashion: 'Clothing, shoes, accessories, department stores, Amazon, online shopping',
  education: 'Tuition, courses, books, school supplies, online learning',
  taxes: 'Government taxes, fines, fees',
  pets: 'Pet food, vet, pet accessories',
  other: 'Everything else that does not fit any category above',
}

export async function aiClassifyTransactions(
  descriptions: string[]
): Promise<ExpenseCategory[]> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey || descriptions.length === 0) return descriptions.map(() => 'other')

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const categoriesList = CATEGORY_OPTIONS.map(
    (c) => `- ${c}: ${CATEGORY_DESCRIPTIONS[c]}`
  ).join('\n')

  const numbered = descriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Classify each transaction description into exactly one category.
Many descriptions are in Hebrew (Israeli bank/credit card exports).

Categories:
${categoriesList}

Transactions:
${numbered}

Reply with ONLY a JSON array of category strings, one per transaction, in the same order.
Example: ["food_restaurants","fuel_transportation","other"]`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return descriptions.map(() => 'other')

  try {
    const result = JSON.parse(match[0]) as string[]
    return result.map((c) =>
      CATEGORY_OPTIONS.includes(c as ExpenseCategory) ? (c as ExpenseCategory) : 'other'
    )
  } catch {
    return descriptions.map(() => 'other')
  }
}
