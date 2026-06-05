import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { useFinanceStore } from '../store/useFinanceStore'
import { askAdvisor, isApiKeyConfigured } from '../lib/anthropic'
import type { ChatMessage } from '../lib/anthropic'
import { formatCurrency } from '../lib/formatters'

function buildFinancialContext(store: ReturnType<typeof useFinanceStore.getState>): string {
  const { accounts, assets, investments, transactions } = store
  const month = new Date().toISOString().slice(0, 7)

  const bankTotal = accounts.reduce((s, a) =>
    s + (a.balanceHistory?.[month] ?? 0) + (a.depositHistory?.[month] ?? 0), 0)
  const assetTotal = assets.reduce((s, a) => s + a.estimatedValue, 0)
  const investTotal = investments.reduce((s, i) => s + i.currentValue, 0)
  const netWorth = bankTotal + assetTotal + investTotal

  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)
    .map((t) => `  - ${t.date}: ${t.type === 'expense' ? '-' : '+'}₪${t.amount} (${t.category}) — ${t.description}`)
    .join('\n')

  return `Net Worth: ${formatCurrency(netWorth)}
Bank accounts: ${accounts.length} account(s), total ${formatCurrency(bankTotal)}
Assets: ${assets.length} asset(s), total ${formatCurrency(assetTotal)}
Investments: ${investments.length} investment(s), total ${formatCurrency(investTotal)}
Recent transactions (last 10):
${recent || '  (none)'}`
}

export default function Advisor() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const apiReady = isApiKeyConfigured()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError(null)

    const userMsg: ChatMessage = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)

    try {
      const ctx = buildFinancialContext(useFinanceStore.getState())
      const reply = await askAdvisor(next, ctx)
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!apiReady) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="card p-6 max-w-sm w-full text-center flex flex-col gap-3">
          <Bot size={40} style={{ color: '#2dd4bf', margin: '0 auto' }} />
          <h2 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>AI Advisor not configured</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Add your Anthropic API key to a <code className="font-mono">.env</code> file in the project root:
          </p>
          <pre
            className="text-xs p-3 rounded-xl text-left"
            style={{ background: 'var(--color-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            VITE_ANTHROPIC_API_KEY=sk-ant-...
          </pre>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Then restart the dev server.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--color-accent-light)' }}
            >
              <Bot size={28} style={{ color: '#2dd4bf' }} />
            </div>
            <h2 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>AI Financial Advisor</h2>
            <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Ask anything about your finances. I have access to your accounts, assets, investments, and recent transactions.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'var(--color-accent-light)' }}
              >
                <Bot size={15} style={{ color: '#2dd4bf' }} />
              </div>
            )}
            <div
              className="max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap"
              style={
                msg.role === 'user'
                  ? { background: '#2dd4bf', color: '#fff' }
                  : { background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }
              }
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: '#2dd4bf20' }}
              >
                <User size={15} style={{ color: '#2dd4bf' }} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent-light)' }}>
              <Bot size={15} style={{ color: '#2dd4bf' }} />
            </div>
            <div className="px-3 py-2 rounded-2xl text-sm" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
              </span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-center py-1" style={{ color: '#f87171' }}>{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="flex gap-2 p-3 border-t pb-safe"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() } }}
          placeholder="Ask about your finances…"
          className="flex-1 px-3 py-2 text-sm rounded-xl outline-none"
          style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          disabled={loading}
        />
        <button
          onClick={() => void handleSend()}
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-opacity"
          style={{
            background: loading || !input.trim() ? 'var(--color-border)' : '#2dd4bf',
            color: '#fff',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
