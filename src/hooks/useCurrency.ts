import { useFinanceStore } from '../store/useFinanceStore'
import type { SupportedCurrency } from '../store/useFinanceStore'
import { convertAmount, formatCurrencyIn, formatCompactIn } from '../lib/formatters'

export function useCurrency() {
  const appSettings = useFinanceStore((s) => s.appSettings)
  const { displayCurrency, exchangeRates, enabledCurrencies } = appSettings

  function format(amount: number, fromCurrency: SupportedCurrency = 'ILS', decimals?: boolean): string {
    const converted = convertAmount(amount, fromCurrency, displayCurrency, exchangeRates)
    return formatCurrencyIn(converted, displayCurrency, decimals)
  }

  function formatCompact(amount: number, fromCurrency: SupportedCurrency = 'ILS'): string {
    const converted = convertAmount(amount, fromCurrency, displayCurrency, exchangeRates)
    return formatCompactIn(converted, displayCurrency)
  }

  return { displayCurrency, rates: exchangeRates, enabledCurrencies, format, formatCompact }
}
