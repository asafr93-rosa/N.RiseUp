import { useState, useMemo } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import toast from 'react-hot-toast'
import { Plus, CreditCard, Upload, ChevronDown, ChevronUp } from 'lucide-react'
import { startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns'
import { useFinanceStore } from '../store/useFinanceStore'
import type { BankAccount, ExpenseCategory } from '../store/useFinanceStore'
import BankAccountCard from '../components/accounts/BankAccountCard'
import BankAccountModal from '../components/accounts/BankAccountModal'
import TransactionModal from '../components/accounts/TransactionModal'
import TransactionFilters from '../components/accounts/TransactionFilters'
import TransactionTable from '../components/accounts/TransactionTable'
import ImportCSVFlow from '../components/accounts/ImportCSVFlow'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import { formatCurrency } from '../lib/formatters'

export default function Accounts() {
  const accounts = useFinanceStore((s) => s.accounts)
  const transactions = useFinanceStore((s) => s.transactions)
  const categoryRules = useFinanceStore((s) => s.categoryRules)
  const addAccount = useFinanceStore((s) => s.addAccount)
  const updateAccount = useFinanceStore((s) => s.updateAccount)
  const deleteAccount = useFinanceStore((s) => s.deleteAccount)
  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction)
  const updateTransactionCategory = useFinanceStore((s) => s.updateTransactionCategory)
  const addTransactionsBatch = useFinanceStore((s) => s.addTransactionsBatch)

  const [accountsRef] = useAutoAnimate<HTMLDivElement>()

  const [addAccountOpen, setAddAccountOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null)
  const [addTxOpen, setAddTxOpen] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const [filterMonth, setFilterMonth] = useState(new Date())
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all')
  const [filterAccountId, setFilterAccountId] = useState<string | 'all'>('all')

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  const filteredTransactions = useMemo(() => {
    const from = startOfMonth(filterMonth)
    const to = endOfMonth(filterMonth)
    return transactions.filter((t) => {
      try {
        const d = parseISO(t.date)
        if (!isWithinInterval(d, { start: from, end: to })) return false
      } catch { return false }
      if (filterCategory !== 'all' && t.category !== filterCategory) return false
      if (filterAccountId !== 'all' && t.bankAccountId !== filterAccountId) return false
      return true
    })
  }, [transactions, filterMonth, filterCategory, filterAccountId])

  return (
    <div className="p-4 pb-6 flex flex-col gap-5">
      {/* Accounts section */}
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
          <div className="flex flex-col items-center py-10 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-card)' }}>
              <CreditCard size={28} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No bank accounts yet</p>
            <Button size="sm" onClick={() => setAddAccountOpen(true)}><Plus size={14} /> Add First Account</Button>
          </div>
        ) : (
          <div ref={accountsRef} className="flex flex-col gap-2">
            {accounts.map((a) => (
              <BankAccountCard key={a.id} account={a} onEdit={() => setEditingAccount(a)} onDelete={() => setDeletingAccount(a)} />
            ))}
          </div>
        )}
      </section>

      {/* Import / Add transactions */}
      {accounts.length > 0 && (
        <section>
          <div className="flex gap-2 mb-3">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => setAddTxOpen(true)}>
              <Plus size={14} /> Add Transaction
            </Button>
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowImport((v) => !v)}>
              <Upload size={14} /> Import CSV
              {showImport ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          </div>

          {showImport && (
            <div className="mb-3">
              <ImportCSVFlow
                accounts={accounts}
                categoryRules={categoryRules}
                onImport={(txns, meta) => {
                  addTransactionsBatch(txns, meta)
                  setShowImport(false)
                }}
              />
            </div>
          )}
        </section>
      )}

      {/* Transaction list */}
      {accounts.length > 0 && (
        <section>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Transactions</p>
          <TransactionFilters
            month={filterMonth}
            onMonthChange={setFilterMonth}
            category={filterCategory}
            onCategoryChange={setFilterCategory}
            accountId={filterAccountId}
            onAccountChange={setFilterAccountId}
            accounts={accounts}
          />
          <TransactionTable
            transactions={filteredTransactions}
            accounts={accounts}
            onDelete={(id) => { deleteTransaction(id); toast.success('Transaction deleted') }}
            onCategoryChange={(id, category) => {
              const t = transactions.find((x) => x.id === id)
              if (t) updateTransactionCategory(id, category, t.description)
            }}
          />
        </section>
      )}

      {/* Modals */}
      <BankAccountModal open={addAccountOpen} onClose={() => setAddAccountOpen(false)} onSave={(d) => { addAccount(d); toast.success('Account added') }} />
      <BankAccountModal open={!!editingAccount} onClose={() => setEditingAccount(null)} onSave={(d) => { if (editingAccount) { updateAccount(editingAccount.id, d); toast.success('Account updated') } }} initial={editingAccount ?? undefined} />
      <ConfirmDialog open={!!deletingAccount} onClose={() => setDeletingAccount(null)} onConfirm={() => { if (deletingAccount) { deleteAccount(deletingAccount.id); toast.success('Account deleted'); setDeletingAccount(null) } }} message={`Delete "${deletingAccount?.name}" and all its transactions? This cannot be undone.`} />
      <TransactionModal open={addTxOpen} onClose={() => setAddTxOpen(false)} onSave={(d) => { addTransaction(d); toast.success('Transaction added') }} accounts={accounts} />
    </div>
  )
}
