import type { ExpenseCategory, CategoryRules } from '../store/useFinanceStore'

// ── Keyword dictionary ────────────────────────────────────────────────────────
// Keys are lowercase substrings. Matched against lowercased business name.

const KEYWORD_MAP: Array<[string[], ExpenseCategory]> = [
  // Food & Restaurants
  [
    ['סופרסל', 'shufersal', 'רמי לוי', 'rami levy', 'יוחננוף', 'yochananof', 'מגה', 'mega',
     'ויקטורי', 'victory', 'פרש מרקט', 'fresh market', 'חצי חינם', 'hatzi hinam',
     'ברקת', 'barcket', 'קשת טעמים', 'כרמל', 'carmel', 'מעדניית',
     'וולט', 'wolt', 'תן ביס', 'ten bis', 'מסעדה', 'restaurant',
     'קפה', 'cafe', 'coffee', 'פיצה', 'pizza', 'סושי', 'sushi',
     'בורגר', 'burger', 'מקדונלד', 'mcdonald', 'מק', 'wendy',
     'שווארמה', 'shawarma', 'פלאפל', 'falafel', 'מאפייה', 'bakery',
     'סטארבקס', 'starbucks', 'ארומה', 'aroma', 'גוגו', 'מינימרקט',
     'kfc', 'domino', 'tortilla', 'hummus'],
    'food_restaurants',
  ],
  // Fuel & Transportation
  [
    ['דלק', 'delek', 'סונול', 'sonol', 'פז', 'paz', 'דור אלון', 'dor alon',
     'גולד', 'ten oil', 'yellow', 'צ׳מפיון', 'champion',
     'גט', 'gett', 'יאנגו', 'yango', 'אינדרייב', 'indrive',
     'מונית', 'taxi', 'אגד', 'egged', 'רכבת', 'rakevet', 'train',
     'רב קו', 'rav kav', 'מטרופולין', 'metropolin', 'דן', 'כפיר',
     'uber', 'bolt', 'lime', 'bird', 'tier', 'scooter',
     'תחנת דלק', 'gas station', 'fuel'],
    'fuel_transportation',
  ],
  // Insurance
  [
    ['ביטוח', 'bituah', 'insurance', 'פניקס', 'phoenix', 'הראל', 'harel',
     'מגדל', 'migdal', 'כלל', 'clal', 'מנורה', 'menora',
     'אי.ג\'י.איי', 'agi', 'הפועלים ביטוח', 'שמשון', 'samson',
     'איילון', 'ayalon', 'אדמירל', 'admiral', 'ביטוח לאומי ביטוח'],
    'insurance',
  ],
  // Shopping & Fashion
  [
    ['זארה', 'zara', 'h&m', 'mango', 'קסטרו', 'castro', 'גולף', 'golf',
     'רנואר', 'renuar', 'נקסט', 'next', 'פוקס', 'fox', 'פוקסהום',
     'טרמינל', 'terminal x', 'תמנון', 'tamnoon', 'אדידס', 'adidas',
     'נייקי', 'nike', 'ריבוק', 'reebok', 'פומה', 'puma',
     'pull&bear', 'bershka', 'stradivarius', 'massimo dutti',
     'timberland', 'levi', 'calvin klein', 'tommy', 'lacoste',
     'bug', 'ivory', 'שישבש', 'sheshbesh', 'ג\'ינס', 'jeans',
     'amazon', 'ebay', 'aliexpress', 'shein', 'temu'],
    'shopping_fashion',
  ],
  // Health
  [
    ['מכבי', 'maccabi', 'כללית', 'clalit', 'לאומית', 'leumit',
     'מאוחדת', 'meuhedet', 'בית חולים', 'hospital', 'רופא', 'doctor',
     'עיניים', 'optika', 'אופטיקה', 'שיניים', 'dental', 'דנטל',
     'super-pharm', 'superpharm', 'סופר-פארם', 'נובו', 'novo',
     'טבע', 'teva', 'בית מרקחת', 'pharmacy', 'רוקחות',
     'קופת חולים', 'physiotherapy', 'פיזיותרפיה', 'ספא', 'spa'],
    'health',
  ],
  // Education
  [
    ['שכר לימוד', 'tuition', 'אוניברסיטה', 'university', 'מכללה', 'college',
     'בית ספר', 'school', 'קורס', 'course', 'חוג', 'workshop',
     'סמינר', 'seminar', 'הכשרה', 'training', 'udemy', 'coursera',
     'linkedin learning', 'כיתה', 'class', 'גן ילדים', 'kindergarten'],
    'education',
  ],
  // Entertainment & Leisure
  [
    ['נטפליקס', 'netflix', 'ספוטיפיי', 'spotify', 'apple music',
     'yes', 'hot', 'סלקום tv', 'פרטנר tv', 'yes planet', 'rav chen',
     'רב חן', 'סינמה', 'cinema', 'movie', 'סינמה סיטי', 'cinema city',
     'כרטיסי הופעה', 'leaan', 'לאן', 'bimot', 'בימות',
     'amusement', 'שעשועים', 'גן חיות', 'zoo', 'מוזיאון', 'museum',
     'ספורט', 'sport', 'כושר', 'gym', 'fitness', 'מרכז ספורט',
     'disney', 'hbo', 'amazon prime', 'apple tv',
     'psn', 'xbox', 'steam', 'nintendo'],
    'entertainment_leisure',
  ],
  // Housing
  [
    ['שכר דירה', 'rent', 'משכנתא', 'mortgage', 'ועד בית', 'vad bayit',
     'ועד הבית', 'building committee', 'ארנונה', 'arnona', 'property tax'],
    'housing',
  ],
  // Household Bills
  [
    ['חשמל', 'electricity', 'חברת חשמל', 'iec',
     'מים', 'water', 'גז', 'gas', 'מתנ"ס', 'community center',
     'בזק', 'bezeq', 'פרטנר', 'partner', 'גולן טלקום', 'golan telecom',
     'hot mobile', 'סלקום', 'cellcom', 'קבוצת רמי', 'רמי',
     'icloud', 'google storage', 'one drive', 'dropbox',
     'אינטרנט', 'internet', 'broadband', 'wifi'],
    'household_bills',
  ],
  // Taxes
  [
    ['מס הכנסה', 'income tax', 'מס', 'tax', 'מע"מ', 'vat',
     'biztranot', 'ביזטרנות', 'משרד האוצר', 'treasury',
     'רשות המסים', 'tax authority', 'עיריית', 'municipality'],
    'taxes',
  ],
]

// ── Main export ───────────────────────────────────────────────────────────────

export function categorizeByKeyword(
  businessName: string,
  userRules: CategoryRules = {}
): ExpenseCategory {
  const lower = businessName.toLowerCase().trim()

  // 1. Check user-learned rules first
  if (userRules[lower]) return userRules[lower]

  // Also check partial matches in user rules
  for (const [key, category] of Object.entries(userRules)) {
    if (lower.includes(key) || key.includes(lower)) return category
  }

  // 2. Keyword dictionary
  for (const [keywords, category] of KEYWORD_MAP) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) return category
    }
  }

  return 'other'
}

export function categorizeTransactions(
  businessNames: string[],
  userRules: CategoryRules = {}
): ExpenseCategory[] {
  return businessNames.map((name) => categorizeByKeyword(name, userRules))
}
