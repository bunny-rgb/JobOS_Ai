import 'server-only'

// Available models. `provider` decides which API to call.
export const MODELS = [
  // Gemini (Google direct)
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'gemini', endpoint: 'gemini-2.5-pro' },
  { id: 'gemini-flash-latest', label: 'Gemini Flash (latest)', provider: 'gemini', endpoint: 'gemini-flash-latest' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'gemini', endpoint: 'gemini-2.5-flash' },
  // OpenRouter (many providers, one key)
  { id: 'openai/gpt-4o', label: 'GPT-4o (via OpenRouter)', provider: 'openrouter', endpoint: 'openai/gpt-4o' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o mini (via OpenRouter)', provider: 'openrouter', endpoint: 'openai/gpt-4o-mini' },
  { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (via OpenRouter)', provider: 'openrouter', endpoint: 'anthropic/claude-3.5-sonnet' },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B (via OpenRouter)', provider: 'openrouter', endpoint: 'meta-llama/llama-3.3-70b-instruct' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3 (via OpenRouter)', provider: 'openrouter', endpoint: 'deepseek/deepseek-chat' },
]

export const DEFAULT_MODEL_ID = 'gemini-2.5-pro'

function resolveModel(modelId) {
  return MODELS.find(m => m.id === modelId) || MODELS.find(m => m.id === DEFAULT_MODEL_ID)
}

async function callGemini({ modelEndpoint, system, prompt }) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('Missing GEMINI_API_KEY')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:generateContent`
  const body = {
    system_instruction: system ? { parts: [{ text: system }] } : undefined,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${t.slice(0, 400)}`)
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
  return text
}

async function callOpenRouter({ modelEndpoint, system, prompt }) {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('Missing OPENROUTER_API_KEY')
  const messages = []
  if (system) messages.push({ role: 'system', content: system })
  messages.push({ role: 'user', content: prompt })
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://jobos.ai',
      'X-Title': 'JobOS AI',
    },
    body: JSON.stringify({
      model: modelEndpoint,
      messages,
      temperature: 0.3,
      max_tokens: 2048,
    }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`OpenRouter API error ${res.status}: ${t.slice(0, 400)}`)
  }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content || ''
}

export async function llmText({ modelId, system, prompt }) {
  const m = resolveModel(modelId)
  if (m.provider === 'gemini') return callGemini({ modelEndpoint: m.endpoint, system, prompt })
  return callOpenRouter({ modelEndpoint: m.endpoint, system, prompt })
}

export async function llmJson({ modelId, system, prompt }) {
  const sys = (system || 'You are a helpful career AI. Always respond with valid JSON only, no markdown fences, no preamble.')
  const text = await llmText({ modelId, system: sys, prompt })
  const cleaned = String(text).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  try { return JSON.parse(cleaned) } catch {
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (m) { try { return JSON.parse(m[0]) } catch {} }
    return { _raw: cleaned }
  }
}
