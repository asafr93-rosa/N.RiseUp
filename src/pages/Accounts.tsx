import { useState, useMemo } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import toast from 'react-hot-toast'
import { Plus, CreditCard as CreditCardIcon, Upload, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react'
import { startOfMonth, endOfMonth, parseISO, isWithinInterval, addMonths, subMonths } from 'date-fns'
import { useFinanceStore } from '../store/useFinanceStore'
import type { CreditCard, RecurringExpense, ExpenseCategory, Transaction, IncomeEntry } from '../store/useFinanceStore'
import BankAccountCard from '../components/accounts/BankAccountCard'
import BankAccountModal from '../components/accounts/BankAccountModal'
import TransactionTable from '../components/accounts/TransactionTable'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import { formatCurrency, getMonthLabel, CATEGORY_LABELS, CATEGORY_COLORS, convertAmount } from '../lib/formatters'
import CreditCardCard from '../components/accounts/CreditCardCard'
import CreditCardModal from '../components/accounts/CreditCardModal'
import CreditCardCSVFlow from '../components/accounts/CreditCardCSVFlow'
import AddExpenseModal from '../components/accounts/AddExpenseModal'
import IncomeModal from '../components/accounts/IncomeModal'
import IncomeSection from '../components/accounts/IncomeSection'
import RecurringExpenseModal from '../components/accounts/RecurringExpenseModal'
import RecurringExpensesSection from '../components/accounts/RecurringExpensesSection'
import RecommendationSection from '../components/accounts/RecommendationSection'
import AIImportBanner from '../components/accounts/AIImportBanner'

export default function Accounts() {
  // ── Store selectors ──────────────────────────────────────────────────────────
  const accounts = useFinanceStore((s) => s.accounts)
  const transactions = useFinanceStore((s) => s.transactions)
  const categoryRules = useFinanceStore((s) => s.categoryRules)
  const creditCards = useFinanceStore((s) => s.creditCards)
  const incomeEntries = useFinanceStore((s) => s.incomeEntries)
  const recurringExpenses = useFinanceStore((s) => s.recurringExpenses)

  // Store actions
  const addAccount = useFinanceStore((s) => s.addAccount)
  const updateAccount = useFinanceStore((s) => s.updateAccount)
  const deleteAccount = useFinanceStore((s) => s.deleteAccount)
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction)
  const deleteTransactions = useFinanceStore((s) => s.deleteTransactions)
  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const updateTransaction = useFinanceStore((s) => s.updateTransaction)
  const updateTransactionCategory = useFinanceStore((s) => s.updateTransactionCategory)
  const addTransactionsBatch = useFinanceStore((s) => s.addTransactionsBatch)

  const addCreditCard = useFinanceStore((s) => s.addCreditCard)
  const updateCreditCard = useFinanceStore((s) => s.updateCreditCard)
  const deleteCreditCard = useFinanceStore((s) => s.deleteCreditCard)

  const addIncomeEntry = useFinanceStore((s) => s.addIncomeEntry)
  const updateIncomeEntry = useFinanceStore((s) => s.updateIncomeEntry)
  const deleteIncomeEntry = useFinanceStore((s) => s.deleteIncomeEntry)

  const addRecurringExpense = useFinanceStore((s) => s.addRecurringExpense)
  const updateRecurringExpense = useFinanceStore((s) => s.updateRecurringExpense)
  const deleteRecurringExpense = useFinanceStore((s) => s.deleteRecurringExpense)
  const bulkUpdateTransactionCategory = useFinanceStore((s) => s.bulkUpdateTransactionCategory)
  const setAccountMonthBalance = useFinanceStore((s) => s.setAccountMonthBalance)
  const userProfile = useFinanceStore((s) => s.userProfile)
  const investments = useFinanceStore((s) => s.investments)
  const appSettings = useFinanceStore((s) => s.appSettings)

  // ── Auto-animate refs ────────────────────────────────────────────────────────
  const [accountsRef] = useAutoAnimate<HTMLDivElement>()
  const [cardsRef] = useAutoAnimate<HTMLDivElement>()

  // ── Shared month filter ──────────────────────────────────────────────────────
  const [filterMonth, setFilterMonth] = useState(new Date())

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [addAccountOpen, setAddAccountOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState<{ id: string; name: string } | null>(null)

  const [addCardOpen, setAddCardOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [deletingCard, setDeletingCard] = useState<CreditCard | null>(null)

  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [showCCImport, setShowCCImport] = useState(false)
  const [ccFilterCategory, setCCFilterCategory] = useState<ExpenseCategory | 'all'>('all')
  const [ccFilterCardId, setCCFilterCardId] = useState<string | 'all'>('all')

  const [addIncomeOpen, setAddIncomeOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null)
  const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null)
  const [addRecurringOpen, setAddRecurringOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null)
  const [deletingRecurringId, setDeletingRecurringId] = useState<string | null>(null)

  // Multiselect state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deletingBulk, setDeletingBulk] = useState<string[] | null>(null)

  // ── Filter month key ─────────────────────────────────────────────────────────
  const filterMonthKey = useMemo(() =>
    `${filterMonth.getFullYear()}-${String(filterMonth.getMonth() + 1).padStart(2, '0')}`,
  [filterMonth])

  // ── Reactive effective balance per account (month-scoped) ────────────────────
  const accountEffectiveBalances = useMemo(() => {
    const map: Record<string, number> = {}
    const from = startOfMonth(filterMonth)
    const to = endOfMonth(filterMonth)
    const inMonth = (dateStr: string) => {
      try { return isWithinInterval(parseISO(dateStr), { start: from, end: to }) }
      catch { return false }
    }
    for (const a of accounts) {
      const rawBalance = a.balanceHistory?.[filterMonthKey] ?? 0
      const acctCurrency = a.currency ?? 'ILS'
      const balance = convertAmount(rawBalance, acctCurrency, 'ILS', appSettings.exchangeRates)
      const linkedCardIds = creditCards
        .filter((c) => c.bankAccountId === a.id)
        .map((c) => c.id)
      const expenses = transactions
        .filter((t) => t.type === 'expense' && t.creditCardId && linkedCardIds.includes(t.creditCardId) && inMonth(t.date))
        .reduce((s, t) => s + t.amount, 0)
      const income = incomeEntries
        .filter((e) => e.bankAccountId === a.id && inMonth(e.date))
        .reduce((s, e) => s + e.amount, 0)
      const recurringLinked = recurringExpenses
        .filter((r) => r.isActive && r.bankAccountId === a.id)
        .reduce((s, r) => s + r.amount, 0)
      const recurringViaCc = recurringExpenses
        .filter((r) => r.isActive && r.creditCardId != null &&
          creditCards.find((cc) => cc.id === r.creditCardId)?.bankAccountId === a.id)
        .reduce((s, r) => s + r.amount, 0)
      map[a.id] = balance - expenses - recurringLinked - recurringViaCc + income
    }
    return map
  }, [accounts, creditCards, transactions, incomeEntries, recurringExpenses, filterMonth, filterMonthKey, appSettings])

  const totalBalance = Object.values(accountEffectiveBalances).reduce((s, v) => s + v, 0)

  // ── Monthly expense total per credit card ─────────────────────────────────────
  const cardMonthlyTotals = useMemo(() => {
    const from = startOfMonth(filterMonth)
    const to = endOfMonth(filterMonth)
    const map: Record<string, { expenses: number; recurring: number }> = {}
    for (const c of creditCards) {
      const expenses = transactions
        .filter((t) => {
          if (t.type !== 'expense' || t.creditCardId !== c.id) return false
          try { return isWithinInterval(parseISO(t.date), { start: from, end: to }) }
          catch { return false }
        })
        .reduce((s, t) => s + t.amount, 0)
      const recurring = recurringExpenses
        .filter((r) => r.isActive && r.creditCardId === c.id)
        .reduce((s, r) => s + r.amount, 0)
      map[c.id] = { expenses, recurring }
    }
    return map
  }, [creditCards, transactions, recurringExpenses, filterMonth])

  // ── CC transactions for selected month ────────────────────────────────────────
  const ccTransactions = useMemo(() => {
    const from = startOfMonth(filterMonth)
    const to = endOfMonth(filterMonth)
    return transactions.filter((t) => {
      if (!t.creditCardId) return false
      try {
        if (!isWithinInterval(parseISO(t.date), { start: from, end: to })) return false
      } catch { return false }
      if (ccFilterCategory !== 'all' && t.category !== ccFilterCategory) return false
      if (ccFilterCardId !== 'all' && t.creditCardId !== ccFilterCardId) return false
      return true
    })
  }, [transactions, filterMonth, ccFilterCategory, ccFilterCardId])

  // ── Monthly summary — always unfiltered ──────────────────────────────────────
  const allMonthCCExpenses = useMemo(() => {
    const from = startOfMonth(filterMonth)
    const to = endOfMonth(filterMonth)
    return transactions
      .filter((t) => {
        if (!t.creditCardId || t.type !== 'expense') return false
        try { return isWithinInterval(parseISO(t.date), { start: from, end: to }) }
        catch { return false }
      })
      .reduce((s, t) => s + t.amount, 0)
  }, [transactions, filterMonth])
  const activeRecurringTotal = recurringExpenses.filter((r) => r.isActive).reduce((s, r) => s + r.amount, 0)
  const monthlyExpenses = allMonthCCExpenses + activeRecurringTotal

  // ── Filtered subtotal (for the subtotal box when a filter is active) ──────────
  const hasFilter = ccFilterCategory !== 'all' || ccFilterCardId !== 'all'
  const filteredExpensesSubtotal = ccTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const monthIncomeEntries = useMemo(() => {
    const from = startOfMonth(filterMonth)
    const to = endOfMonth(filterMonth)
    return incomeEntries.filter((e) => {
      try { return isWithinInterval(parseISO(e.date), { start: from, end: to }) }
      catch { return false }
    })
  }, [incomeEntries, filterMonth])

  const monthlyIncome = monthIncomeEntries.reduce((s, e) => s + e.amount, 0)

  const netBalance = monthlyIncome - monthlyExpenses

  // ── Expense handlers (no balance mutation — balance is computed reactively) ──
  function handleAddExpense(d: Parameters<typeof addTransaction>[0]) {
    addTransaction(d)
    toast.success('Expense added')
  }

  function handleEditExpense(d: Parameters<typeof addTransaction>[0]) {
    if (!editingExpense) return
    updateTransaction(editingExpense.id, d)
    setEditingExpense(null)
    toast.success('Expense updated')
  }

  function handleDeleteExpense(id: string) {
    deleteTransaction(id)
    toast.success('Transaction deleted')
  }

  function handleCSVImport(txns: Parameters<typeof addTransactionsBatch>[0], meta: Parameters<typeof addTransactionsBatch>[1]) {
    addTransactionsBatch(txns, meta)
    setShowCCImport(false)
    if (txns.length > 0) {
      const latestDate = txns.reduce((a, b) => a.date > b.date ? a : b).date
      setFilterMonth(parseISO(latestDate))
    }
    toast.success(`Imported ${txns.length} expenses`)
  }

  // ── Income handlers ───────────────────────────────────────────────────────────
  function handleAddIncome(d: Parameters<typeof addIncomeEntry>[0]) {
    addIncomeEntry(d)
    toast.success('Income added')
  }

  function handleEditIncome(d: Parameters<typeof addIncomeEntry>[0]) {
    if (!editingIncome) return
    updateIncomeEntry(editingIncome.id, d)
    setEditingIncome(null)
    toast.success('Income updated')
  }

  function handleDeleteIncome(id: string) {
    deleteIncomeEntry(id)
    toast.success('Income deleted')
  }

  return (
    <div className="p-4 pb-6 flex flex-col gap-6">

      {/* ── Shared month navigator ── */}
      {(accounts.length > 0 || creditCards.length > 0) && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMonth((m) => subMonths(m, 1))}
            className="p-1.5 rounded-lg"
            style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="flex-1 text-center text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {getMonthLabel(filterMonth)}
          </span>
          <button
            onClick={() => setFilterMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded-lg"
            style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── AI Import Banner ── */}
      {creditCards.length > 0 && (
        <AIImportBanner creditCards={creditCards} onImport={handleCSVImport} />
      )}

      {/* ── Section 1: Bank Accounts ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="section-label flex-1">Bank Accounts</p>
          <Button size="sm" onClick={() => setAddAccountOpen(true)} style={{ marginLeft: 8 }}>
            <Plus size={12} /> Add
          </Button>
        </div>
        {accounts.length > 0 && (
          <div className="flex items-baseline gap-2 mb-3">
            <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Total Cash</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: '"DM Mono", monospace', color: 'var(--color-text-primary)' }}>{formatCurrency(totalBalance)}</span>
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-card)' }}>
              <CreditCardIcon size={28} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No bank accounts yet</p>
            <Button size="sm" onClick={() => setAddAccountOpen(true)}><Plus size={14} /> Add First Account</Button>
          </div>
        ) : (
          <div ref={accountsRef} className="grid grid-cols-2 gap-3">
            {accounts.map((a) => (
              <BankAccountCard
                key={a.id}
                account={a}
                filterMonthKey={filterMonthKey}
                effectiveBalance={accountEffectiveBalances[a.id] ?? 0}
                onSave={(d) => {
                  updateAccount(a.id, { name: d.name, lastFourDigits: d.lastFourDigits, currency: d.currency })
                  setAccountMonthBalance(a.id, filterMonthKey, d.balance, d.deposit)
                  toast.success('Account updated')
                }}
                onDelete={() => setDeletingAccount({ id: a.id, name: a.name })}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Section 2: Credit Cards ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="section-label flex-1">Credit Cards</p>
          <Button size="sm" onClick={() => setAddCardOpen(true)} style={{ marginLeft: 8 }}>
            <Plus size={12} /> Add
          </Button>
        </div>

        {creditCards.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2 rounded-2xl" style={{ background: 'var(--color-card)' }}>
            <CreditCardIcon size={24} style={{ color: 'var(--color-text-secondary)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No credit cards yet</p>
            <Button size="sm" onClick={() => setAddCardOpen(true)}><Plus size={14} /> Add Card</Button>
          </div>
        ) : (
          <div ref={cardsRef} className="grid grid-cols-2 gap-3">
            {creditCards.map((c) => {
              const accName = c.bankAccountId ? accounts.find((a) => a.id === c.bankAccountId)?.name : undefined
              return (
                <CreditCardCard
                  key={c.id}
                  card={c}
                  linkedAccountName={accName}
                  monthlyExpenses={cardMonthlyTotals[c.id]?.expenses ?? 0}
                  monthlyRecurring={cardMonthlyTotals[c.id]?.recurring ?? 0}
                  onEdit={() => setEditingCard(c)}
                  onDelete={() => setDeletingCard(c)}
                />
              )
            })}
          </div>
        )}
      </section>

      {/* ── Recommendations ── */}
      <RecommendationSection
        accounts={accounts}
        effectiveBalances={accountEffectiveBalances}
        filterMonthKey={filterMonthKey}
        investments={investments}
        priorities={userProfile.recommendationPriorities}
      />

      {/* ── CC transactions area ── */}
      {creditCards.length > 0 && (
        <>
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={ccFilterCategory}
              onChange={(e) => setCCFilterCategory(e.target.value as ExpenseCategory | 'all')}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl outline-none"
              style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              <option value="all">All categories</option>
              {(Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {creditCards.length > 1 && (
              <select
                value={ccFilterCardId}
                onChange={(e) => setCCFilterCardId(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl outline-none"
                style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                <option value="all">All cards</option>
                {creditCards.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.lastFourDigits ? ` ···· ${c.lastFourDigits}` : ''}</option>
                ))}
              </select>
            )}
          </div>

          {/* Quick Actions dock */}
          <div className="quick-actions-dock flex flex-col gap-2">
            <p className="section-label">Quick Actions</p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => setShowCCImport((v) => !v)}>
                <Upload size={13} /> Import
              </Button>
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setAddExpenseOpen(true)}>
                <Plus size={13} /> Expense
              </Button>
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setAddIncomeOpen(true)}>
                <Plus size={13} /> Income
              </Button>
            </div>
          </div>

          {/* CSV import */}
          {showCCImport && (
            <CreditCardCSVFlow
              creditCards={creditCards}
              categoryRules={categoryRules}
              onImport={handleCSVImport}
            />
          )}

          {/* Financial summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="card p-3 flex flex-col gap-1">
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Expenses</p>
              <p className="text-sm font-bold" style={{ color: '#f87171' }}>{formatCurrency(monthlyExpenses)}</p>
            </div>
            <div className="card p-3 flex flex-col gap-1">
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Income</p>
              <p className="text-sm font-bold" style={{ color: '#34d399' }}>{formatCurrency(monthlyIncome)}</p>
            </div>
            <div className="card p-3 flex flex-col gap-1">
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Net</p>
              <p className="text-sm font-bold" style={{ color: netBalance >= 0 ? '#34d399' : '#f87171' }}>
                {netBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(netBalance))}
              </p>
            </div>
          </div>

          {/* Expenses list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="section-label">Transactions</p>
              <div className="flex gap-1.5">
                {selectMode ? (
                  <>
                    <button
                      onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={selectedIds.size === 0}
                      onClick={() => setDeletingBulk([...selectedIds])}
                      className="text-xs px-2 py-1 rounded-lg font-medium"
                      style={{ background: selectedIds.size > 0 ? '#f8717120' : 'var(--color-surface)', color: selectedIds.size > 0 ? '#f87171' : 'var(--color-text-secondary)', border: `1px solid ${selectedIds.size > 0 ? '#f8717140' : 'var(--color-border)'}` }}
                    >
                      Delete ({selectedIds.size})
                    </button>
                    <button
                      disabled={ccTransactions.length === 0}
                      onClick={() => setDeletingBulk(ccTransactions.map((t) => t.id))}
                      className="text-xs px-2 py-1 rounded-lg font-medium"
                      style={{ background: '#f8717120', color: '#f87171', border: '1px solid #f8717140' }}
                    >
                      Delete All
                    </button>
                    {selectedIds.size > 0 && (
                      <select
                        key={`cat-select-${selectedIds.size}`}
                        defaultValue=""
                        onChange={(e) => {
                          if (!e.target.value) return
                          bulkUpdateTransactionCategory([...selectedIds], e.target.value as ExpenseCategory)
                          setSelectedIds(new Set())
                          setSelectMode(false)
                          toast.success('Category updated')
                        }}
                        className="text-xs px-2 py-1.5 rounded-lg outline-none"
                        style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                      >
                        <option value="" disabled>Set category…</option>
                        {(Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => setSelectMode(true)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                  >
                    <CheckSquare size={12} /> Select
                  </button>
                )}
              </div>
            </div>
            {hasFilter && (() => {
              const accentColor = ccFilterCategory !== 'all'
                ? (CATEGORY_COLORS[ccFilterCategory] ?? '#2dd4bf')
                : '#2dd4bf'
              const labelParts = [
                ccFilterCategory !== 'all' ? CATEGORY_LABELS[ccFilterCategory] : null,
                ccFilterCardId !== 'all' ? (() => {
                  const c = creditCards.find((x) => x.id === ccFilterCardId)
                  return c ? `${c.name}${c.lastFourDigits ? ` ···· ${c.lastFourDigits}` : ''}` : null
                })() : null,
              ].filter(Boolean).join(' · ')
              const count = ccTransactions.filter((t) => t.type === 'expense').length
              return (
                <div
                  className="rounded-xl px-3 py-2.5 mb-3 flex items-center justify-between gap-3"
                  style={{
                    background: 'var(--color-card)',
                    borderTop: '1px solid var(--color-border)',
                    borderRight: '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-border)',
                    borderLeft: `3px solid ${accentColor}`,
                  }}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{labelParts}</p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{count} transaction{count !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-sm font-bold shrink-0" style={{ color: '#f87171' }}>{formatCurrency(filteredExpensesSubtotal)}</p>
                </div>
              )
            })()}
            {selectMode && selectedIds.size > 0 && (() => {
              const subtotal = ccTransactions
                .filter((t) => selectedIds.has(t.id))
                .reduce((s, t) => s + t.amount, 0)
              return (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl mb-2 text-xs font-medium"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{selectedIds.size} selected</span>
                  <span style={{ color: 'var(--color-expense)' }}>{formatCurrency(subtotal)}</span>
                </div>
              )
            })()}
            <TransactionTable
              transactions={ccTransactions}
              accounts={accounts}
              creditCards={creditCards}
              onDelete={(id) => setDeletingExpenseId(id)}
              onEdit={(t) => setEditingExpense(t)}
              onCategoryChange={(id, category) => {
                const t = transactions.find((x) => x.id === id)
                if (t) updateTransactionCategory(id, category, t.description)
              }}
              selectMode={selectMode}
              selectedIds={selectedIds}
              onToggleSelect={(id) => setSelectedIds((prev) => {
                const next = new Set(prev)
                next.has(id) ? next.delete(id) : next.add(id)
                return next
              })}
              onToggleSelectAll={(allIds) => {
                const allSelected = allIds.every((id) => selectedIds.has(id))
                setSelectedIds(allSelected ? new Set() : new Set(allIds))
              }}
            />
            {ccTransactions.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
                No expenses found for this period.
              </p>
            )}
          </div>
        </>
      )}

      {/* ── Income + Recurring ── */}
      <section className="flex flex-col gap-3">
        <IncomeSection
          incomeEntries={monthIncomeEntries}
          onAdd={() => setAddIncomeOpen(true)}
          onEdit={(entry) => setEditingIncome(entry)}
          onDelete={(id) => setDeletingIncomeId(id)}
        />
        <RecurringExpensesSection
          recurringExpenses={recurringExpenses}
          accounts={accounts}
          creditCards={creditCards}
          onAdd={() => setAddRecurringOpen(true)}
          onEdit={(e) => setEditingRecurring(e)}
          onDelete={(id) => setDeletingRecurringId(id)}
        />
      </section>

      {/* ── Modals: Bank ── */}
      <BankAccountModal
        open={addAccountOpen}
        onClose={() => setAddAccountOpen(false)}
        onSave={(d) => {
          addAccount({
            name: d.name, lastFourDigits: d.lastFourDigits,
            balanceHistory: { [filterMonthKey]: d.balance },
            depositHistory: { [filterMonthKey]: d.deposit },
            currency: d.currency,
          })
          toast.success('Account added')
        }}
      />
      <ConfirmDialog
        open={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        onConfirm={() => { if (deletingAccount) { deleteAccount(deletingAccount.id); toast.success('Account deleted'); setDeletingAccount(null) } }}
        message={`Delete "${deletingAccount?.name}" and all its transactions? This cannot be undone.`}
      />

      {/* ── Modals: Credit Cards ── */}
      <CreditCardModal
        open={addCardOpen}
        onClose={() => setAddCardOpen(false)}
        onSave={(d) => { addCreditCard(d); toast.success('Card added') }}
        accounts={accounts}
      />
      <CreditCardModal
        open={!!editingCard}
        onClose={() => setEditingCard(null)}
        onSave={(d) => { if (editingCard) { updateCreditCard(editingCard.id, d); toast.success('Card updated') } }}
        initial={editingCard ?? undefined}
        accounts={accounts}
      />
      <ConfirmDialog
        open={!!deletingCard}
        onClose={() => setDeletingCard(null)}
        onConfirm={() => { if (deletingCard) { deleteCreditCard(deletingCard.id); toast.success('Card deleted'); setDeletingCard(null) } }}
        message={`Delete "${deletingCard?.name}" and all its transactions? This cannot be undone.`}
      />

      {/* ── Modals: Expenses ── */}
      <AddExpenseModal
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        onSave={handleAddExpense}
        creditCards={creditCards}
        categoryRules={categoryRules}
      />
      <AddExpenseModal
        open={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        onSave={handleEditExpense}
        creditCards={creditCards}
        categoryRules={categoryRules}
        initial={editingExpense ?? undefined}
      />
      <ConfirmDialog
        open={!!deletingExpenseId}
        onClose={() => setDeletingExpenseId(null)}
        onConfirm={() => { if (deletingExpenseId) { handleDeleteExpense(deletingExpenseId); setDeletingExpenseId(null) } }}
        message="Delete this expense? This cannot be undone."
      />
      <ConfirmDialog
        open={!!deletingBulk}
        onClose={() => setDeletingBulk(null)}
        onConfirm={() => {
          if (deletingBulk) {
            deleteTransactions(deletingBulk)
            toast.success(`${deletingBulk.length} expense${deletingBulk.length !== 1 ? 's' : ''} deleted`)
            setDeletingBulk(null)
            setSelectedIds(new Set())
            setSelectMode(false)
          }
        }}
        message={`Delete ${deletingBulk?.length ?? 0} expense${(deletingBulk?.length ?? 0) !== 1 ? 's' : ''}? This cannot be undone.`}
      />

      {/* ── Modals: Income ── */}
      <IncomeModal
        open={addIncomeOpen}
        onClose={() => setAddIncomeOpen(false)}
        onSave={handleAddIncome}
        accounts={accounts}
      />
      <IncomeModal
        open={!!editingIncome}
        onClose={() => setEditingIncome(null)}
        onSave={handleEditIncome}
        accounts={accounts}
        initial={editingIncome ?? undefined}
      />
      <ConfirmDialog
        open={!!deletingIncomeId}
        onClose={() => setDeletingIncomeId(null)}
        onConfirm={() => { if (deletingIncomeId) { handleDeleteIncome(deletingIncomeId); setDeletingIncomeId(null) } }}
        message="Delete this income entry? This cannot be undone."
      />

      {/* ── Modals: Recurring ── */}
      <RecurringExpenseModal
        open={addRecurringOpen}
        onClose={() => setAddRecurringOpen(false)}
        onSave={(d) => { addRecurringExpense(d); toast.success('Recurring expense added') }}
        accounts={accounts}
        creditCards={creditCards}
      />
      <RecurringExpenseModal
        open={!!editingRecurring}
        onClose={() => setEditingRecurring(null)}
        onSave={(d) => { if (editingRecurring) { updateRecurringExpense(editingRecurring.id, d); toast.success('Updated') } }}
        initial={editingRecurring ?? undefined}
        accounts={accounts}
        creditCards={creditCards}
      />
      <ConfirmDialog
        open={!!deletingRecurringId}
        onClose={() => setDeletingRecurringId(null)}
        onConfirm={() => { if (deletingRecurringId) { deleteRecurringExpense(deletingRecurringId); toast.success('Deleted'); setDeletingRecurringId(null) } }}
        message="Delete this recurring expense? This cannot be undone."
      />
    </div>
  )
}
