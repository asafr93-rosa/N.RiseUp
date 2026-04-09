import { useState, useMemo } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import toast from 'react-hot-toast'
import { Plus, CreditCard as CreditCardIcon, Upload, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { startOfMonth, endOfMonth, parseISO, isWithinInterval, addMonths, subMonths } from 'date-fns'
import { useFinanceStore } from '../store/useFinanceStore'
import type { BankAccount, CreditCard, RecurringExpense, ExpenseCategory } from '../store/useFinanceStore'
import BankAccountCard from '../components/accounts/BankAccountCard'
import BankAccountModal from '../components/accounts/BankAccountModal'
import TransactionModal from '../components/accounts/TransactionModal'
import TransactionFilters from '../components/accounts/TransactionFilters'
import TransactionTable from '../components/accounts/TransactionTable'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import { formatCurrency, getMonthLabel, CATEGORY_LABELS } from '../lib/formatters'
import CreditCardCard from '../components/accounts/CreditCardCard'
import CreditCardModal from '../components/accounts/CreditCardModal'
import CreditCardCSVFlow from '../components/accounts/CreditCardCSVFlow'
import PaymentCycleSummary from '../components/accounts/PaymentCycleSummary'
import AddExpenseModal from '../components/accounts/AddExpenseModal'
import IncomeModal from '../components/accounts/IncomeModal'
import IncomeSection from '../components/accounts/IncomeSection'
import RecurringExpenseModal from '../components/accounts/RecurringExpenseModal'
import RecurringExpensesSection from '../components/accounts/RecurringExpensesSection'

export default function Accounts() {
  // ── Store selectors ──────────────────────────────────────────────────────────
  const accounts = useFinanceStore((s) => s.accounts)
  const transactions = useFinanceStore((s) => s.transactions)
  const categoryRules = useFinanceStore((s) => s.categoryRules)
  const creditCards = useFinanceStore((s) => s.creditCards)
  const incomeEntries = useFinanceStore((s) => s.incomeEntries)
  const recurringExpenses = useFinanceStore((s) => s.recurringExpenses)

  const addAccount = useFinanceStore((s) => s.addAccount)
  const updateAccount = useFinanceStore((s) => s.updateAccount)
  const deleteAccount = useFinanceStore((s) => s.deleteAccount)
  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction)
  const updateTransactionCategory = useFinanceStore((s) => s.updateTransactionCategory)
  const addTransactionsBatch = useFinanceStore((s) => s.addTransactionsBatch)

  const addCreditCard = useFinanceStore((s) => s.addCreditCard)
  const updateCreditCard = useFinanceStore((s) => s.updateCreditCard)
  const deleteCreditCard = useFinanceStore((s) => s.deleteCreditCard)

  const addIncomeEntry = useFinanceStore((s) => s.addIncomeEntry)
  const deleteIncomeEntry = useFinanceStore((s) => s.deleteIncomeEntry)

  const addRecurringExpense = useFinanceStore((s) => s.addRecurringExpense)
  const updateRecurringExpense = useFinanceStore((s) => s.updateRecurringExpense)
  const deleteRecurringExpense = useFinanceStore((s) => s.deleteRecurringExpense)

  // ── Auto-animate refs ────────────────────────────────────────────────────────
  const [accountsRef] = useAutoAnimate<HTMLDivElement>()
  const [cardsRef] = useAutoAnimate<HTMLDivElement>()

  // ── Shared month filter ──────────────────────────────────────────────────────
  const [filterMonth, setFilterMonth] = useState(new Date())

  // ── Bank section state ───────────────────────────────────────────────────────
  const [addAccountOpen, setAddAccountOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null)
  const [addTxOpen, setAddTxOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all')

  // ── Credit card section state ────────────────────────────────────────────────
  const [addCardOpen, setAddCardOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [deletingCard, setDeletingCard] = useState<CreditCard | null>(null)
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [showCCImport, setShowCCImport] = useState(false)
  const [ccFilterCategory, setCCFilterCategory] = useState<ExpenseCategory | 'all'>('all')
  const [ccFilterCardId, setCCFilterCardId] = useState<string | 'all'>('all')

  // ── Income & recurring state ─────────────────────────────────────────────────
  const [addIncomeOpen, setAddIncomeOpen] = useState(false)
  const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null)
  const [addRecurringOpen, setAddRecurringOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null)
  const [deletingRecurringId, setDeletingRecurringId] = useState<string | null>(null)

  // ── Derived data ─────────────────────────────────────────────────────────────
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  const bankTransactions = useMemo(() => {
    const from = startOfMonth(filterMonth)
    const to = endOfMonth(filterMonth)
    return transactions.filter((t) => {
      if (!t.bankAccountId) return false
      try {
        if (!isWithinInterval(parseISO(t.date), { start: from, end: to })) return false
      } catch { return false }
      if (filterCategory !== 'all' && t.category !== filterCategory) return false
      return true
    })
  }, [transactions, filterMonth, filterCategory])

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

  const hasNoTransactions = (accounts.length > 0 || creditCards.length > 0)
    && bankTransactions.length === 0
    && ccTransactions.length === 0

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

      {/* ── Section 1: Bank Accounts ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Total Balance</p>
            <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(totalBalance)}</p>
          </div>
          <Button size="sm" onClick={() => setAddAccountOpen(true)}>
            <Plus size={14} /> Add Account
          </Button>
        </div>

        {accounts.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-card)' }}>
              <CreditCardIcon size={28} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No bank accounts yet</p>
            <Button size="sm" onClick={() => setAddAccountOpen(true)}><Plus size={14} /> Add First Account</Button>
          </div>
        ) : (
          <>
            <div ref={accountsRef} className="flex flex-col gap-2 mb-3">
              {accounts.map((a) => (
                <BankAccountCard key={a.id} account={a} onEdit={() => setEditingAccount(a)} onDelete={() => setDeletingAccount(a)} />
              ))}
            </div>

            <div className="mb-3">
              <Button variant="secondary" size="sm" onClick={() => setAddTxOpen(true)}>
                <Plus size={14} /> Add Transaction
              </Button>
            </div>

            <TransactionFilters
              category={filterCategory}
              onCategoryChange={setFilterCategory}
            />
            <TransactionTable
              transactions={bankTransactions}
              accounts={accounts}
              showEmptyState={false}
              onDelete={(id) => { deleteTransaction(id); toast.success('Transaction deleted') }}
              onCategoryChange={(id, category) => {
                const t = transactions.find((x) => x.id === id)
                if (t) updateTransactionCategory(id, category, t.description)
              }}
            />
          </>
        )}
      </section>

      {/* ── Section 2: Credit Cards + Expenses ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Credit Cards</p>
          <Button size="sm" onClick={() => setAddCardOpen(true)}>
            <Plus size={14} /> Add Card
          </Button>
        </div>

        {creditCards.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2 rounded-2xl" style={{ background: 'var(--color-card)' }}>
            <CreditCardIcon size={24} style={{ color: 'var(--color-text-secondary)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No credit cards yet</p>
            <Button size="sm" onClick={() => setAddCardOpen(true)}><Plus size={14} /> Add Card</Button>
          </div>
        ) : (
          <>
            <div ref={cardsRef} className="flex flex-col gap-2 mb-3">
              {creditCards.map((c) => (
                <CreditCardCard key={c.id} card={c} onEdit={() => setEditingCard(c)} onDelete={() => setDeletingCard(c)} />
              ))}
            </div>

            <div className="flex gap-2 mb-3">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setAddExpenseOpen(true)}>
                <Plus size={14} /> Add Expense
              </Button>
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowCCImport((v) => !v)}>
                <Upload size={14} /> Import CSV
                {showCCImport ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Button>
            </div>

            {showCCImport && (
              <div className="mb-3">
                <CreditCardCSVFlow
                  creditCards={creditCards}
                  categoryRules={categoryRules}
                  onImport={(txns, meta) => {
                    addTransactionsBatch(txns, meta)
                    setShowCCImport(false)
                  }}
                />
              </div>
            )}

            <PaymentCycleSummary creditCards={creditCards} transactions={transactions} />

            {/* CC transaction filters */}
            <div className="flex gap-2 mt-3 mb-3">
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

            <TransactionTable
              transactions={ccTransactions}
              accounts={accounts}
              creditCards={creditCards}
              showEmptyState={false}
              onDelete={(id) => { deleteTransaction(id); toast.success('Transaction deleted') }}
              onCategoryChange={(id, category) => {
                const t = transactions.find((x) => x.id === id)
                if (t) updateTransactionCategory(id, category, t.description)
              }}
            />
          </>
        )}
      </section>

      {/* Single combined empty state for both sections */}
      {hasNoTransactions && (
        <p className="text-sm text-center py-2" style={{ color: 'var(--color-text-secondary)' }}>
          No transactions found for this period.
        </p>
      )}

      {/* ── Section 3: Income + Recurring ── */}
      <section className="flex flex-col gap-3">
        <IncomeSection
          incomeEntries={incomeEntries}
          onAdd={() => setAddIncomeOpen(true)}
          onDelete={(id) => setDeletingIncomeId(id)}
        />
        <RecurringExpensesSection
          recurringExpenses={recurringExpenses}
          onAdd={() => setAddRecurringOpen(true)}
          onEdit={(e) => setEditingRecurring(e)}
          onDelete={(id) => setDeletingRecurringId(id)}
        />
      </section>

      {/* ── Modals: Bank ── */}
      <BankAccountModal
        open={addAccountOpen}
        onClose={() => setAddAccountOpen(false)}
        onSave={(d) => { addAccount(d); toast.success('Account added') }}
      />
      <BankAccountModal
        open={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        onSave={(d) => { if (editingAccount) { updateAccount(editingAccount.id, d); toast.success('Account updated') } }}
        initial={editingAccount ?? undefined}
      />
      <ConfirmDialog
        open={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        onConfirm={() => { if (deletingAccount) { deleteAccount(deletingAccount.id); toast.success('Account deleted'); setDeletingAccount(null) } }}
        message={`Delete "${deletingAccount?.name}" and all its transactions? This cannot be undone.`}
      />
      <TransactionModal
        open={addTxOpen}
        onClose={() => setAddTxOpen(false)}
        onSave={(d) => { addTransaction(d); toast.success('Transaction added') }}
        accounts={accounts}
      />

      {/* ── Modals: Credit Cards ── */}
      <CreditCardModal
        open={addCardOpen}
        onClose={() => setAddCardOpen(false)}
        onSave={(d) => { addCreditCard(d); toast.success('Card added') }}
      />
      <CreditCardModal
        open={!!editingCard}
        onClose={() => setEditingCard(null)}
        onSave={(d) => { if (editingCard) { updateCreditCard(editingCard.id, d); toast.success('Card updated') } }}
        initial={editingCard ?? undefined}
      />
      <ConfirmDialog
        open={!!deletingCard}
        onClose={() => setDeletingCard(null)}
        onConfirm={() => { if (deletingCard) { deleteCreditCard(deletingCard.id); toast.success('Card deleted'); setDeletingCard(null) } }}
        message={`Delete "${deletingCard?.name}" and all its transactions? This cannot be undone.`}
      />
      <AddExpenseModal
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        onSave={(d) => { addTransaction(d); toast.success('Expense added') }}
        creditCards={creditCards}
        categoryRules={categoryRules}
      />

      {/* ── Modals: Income ── */}
      <IncomeModal
        open={addIncomeOpen}
        onClose={() => setAddIncomeOpen(false)}
        onSave={(d) => { addIncomeEntry(d); toast.success('Income added') }}
      />
      <ConfirmDialog
        open={!!deletingIncomeId}
        onClose={() => setDeletingIncomeId(null)}
        onConfirm={() => { if (deletingIncomeId) { deleteIncomeEntry(deletingIncomeId); toast.success('Income deleted'); setDeletingIncomeId(null) } }}
        message="Delete this income entry? This cannot be undone."
      />

      {/* ── Modals: Recurring ── */}
      <RecurringExpenseModal
        open={addRecurringOpen}
        onClose={() => setAddRecurringOpen(false)}
        onSave={(d) => { addRecurringExpense(d); toast.success('Recurring expense added') }}
      />
      <RecurringExpenseModal
        open={!!editingRecurring}
        onClose={() => setEditingRecurring(null)}
        onSave={(d) => { if (editingRecurring) { updateRecurringExpense(editingRecurring.id, d); toast.success('Updated') } }}
        initial={editingRecurring ?? undefined}
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
