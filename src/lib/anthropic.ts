import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
    if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set')
    client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  }
  return client
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function askAdvisor(
  messages: ChatMessage[],
  financialContext: string
): Promise<string> {
  const c = getClient()
  const response = await c.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a personal financial advisor with access to the user's financial data. Be concise, practical, and speak in the same language the user uses. Here is their current financial snapshot:\n\n${financialContext}`,
    messages,
  })
  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
}

export function isApiKeyConfigured(): boolean {
  return Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY)
}
