import type { ExchangeRates } from '../store/useFinanceStore'

/**
 * Fetch live rates from open.er-api.com with ILS as base.
 * Returns rates in our convention: X_ILS = "how many ILS per 1 X"
 */
export async function fetchLiveRates(): Promise<ExchangeRates> {
  const res = await fetch('https://open.er-api.com/v6/latest/ILS')
  if (!res.ok) throw new Error(`Rate fetch failed: ${res.status}`)
  const data = await res.json() as { rates: Record<string, number> }
  // data.rates.USD means "1 ILS = X USD", so ILS per 1 USD = 1/data.rates.USD
  return {
    USD_ILS: 1 / data.rates.USD,
    EUR_ILS: 1 / data.rates.EUR,
    GBP_ILS: 1 / data.rates.GBP,
    lastUpdated: new Date().toISOString(),
  }
}
