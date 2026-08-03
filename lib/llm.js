import 'server-only'
import { LlmChat, UserMessage } from 'emergentintegrations'

const MODELS = {
  openai: process.env.EMERGENT_OPENAI_MODEL || 'gpt-5',
  anthropic: process.env.EMERGENT_ANTHROPIC_MODEL || 'claude-sonnet-4-5',
}

export async function llmJson({ provider = 'openai', system, prompt, sessionId }) {
  if (!process.env.EMERGENT_LLM_KEY) throw new Error('Missing EMERGENT_LLM_KEY')
  const p = ['openai', 'anthropic'].includes(provider) ? provider : 'openai'
  const chat = new LlmChat(
    process.env.EMERGENT_LLM_KEY,
    sessionId || `s-${Date.now()}`,
    system || 'You are a helpful career AI. Always respond with valid JSON only, no markdown fences.'
  ).withModel(p, MODELS[p])

  const result = await chat.sendMessage(new UserMessage({ text: prompt }))
  const text = typeof result === 'string' ? result : (result?.text || result?.content || JSON.stringify(result))
  // strip code fences if any
  const cleaned = String(text).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch (e) {
    // try to extract first JSON block
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (m) {
      try { return JSON.parse(m[0]) } catch {}
    }
    return { _raw: cleaned }
  }
}

export async function llmText({ provider = 'openai', system, prompt, sessionId }) {
  if (!process.env.EMERGENT_LLM_KEY) throw new Error('Missing EMERGENT_LLM_KEY')
  const p = ['openai', 'anthropic'].includes(provider) ? provider : 'openai'
  const chat = new LlmChat(
    process.env.EMERGENT_LLM_KEY,
    sessionId || `s-${Date.now()}`,
    system || 'You are a helpful career AI copilot.'
  ).withModel(p, MODELS[p])
  const result = await chat.sendMessage(new UserMessage({ text: prompt }))
  return typeof result === 'string' ? result : (result?.text || result?.content || JSON.stringify(result))
}
