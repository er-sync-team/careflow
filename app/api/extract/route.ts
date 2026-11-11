import { NextResponse } from 'next/server';
import { SYMPTOMS, extractSymptomsFromText } from '@/lib/triage/catalog';

const VALID_IDS = new Set(SYMPTOMS.map((s) => s.id));

type AiResult = { ids: string[]; provider: 'gemini' | 'openai' } | { error: string };

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
// Tried in order; aliases keep working when Google retires a dated model name.
const GEMINI_MODELS = [process.env.GEMINI_MODEL, 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.5-flash-lite'].filter(
  (m): m is string => Boolean(m),
);

const systemPrompt = () =>
  'You extract symptoms from patient text, which may be written in Arabic (any dialect) or English. ' +
  'Reply only with JSON {"symptoms": string[]} using ONLY these ids: ' +
  SYMPTOMS.map((s) => `${s.id} (${s.label})`).join(', ') +
  '. Include every symptom that is mentioned or clearly described. Do not diagnose. Do not judge urgency.';

async function callChat(url: string, key: string, model: string, text: string): Promise<{ status: number; ids?: string[] }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt() },
        { role: 'user', content: text },
      ],
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return { status: res.status };
  const json = await res.json();
  const raw = String(json?.choices?.[0]?.message?.content ?? '{}').replace(/^```(?:json)?\s*|\s*```$/g, '');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed?.symptoms)) return { status: 422 };
  return { status: 200, ids: parsed.symptoms.filter((s: unknown): s is string => typeof s === 'string' && VALID_IDS.has(s)) };
}

/** Gemini (free tier) is preferred; OpenAI is used only if no Gemini key is set. */
async function extractWithAi(text: string): Promise<AiResult> {
  try {
    if (process.env.GEMINI_API_KEY) {
      let last = 0;
      for (const model of GEMINI_MODELS) {
        const r = await callChat(GEMINI_URL, process.env.GEMINI_API_KEY, model, text);
        if (r.ids) return { ids: r.ids, provider: 'gemini' };
        last = r.status;
        if (r.status !== 404 && r.status !== 400) break; // only a missing/invalid model name is worth retrying
      }
      return { error: `gemini_http_${last}` };
    }
    if (process.env.OPENAI_API_KEY) {
      const r = await callChat('https://api.openai.com/v1/chat/completions', process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || 'gpt-4o-mini', text);
      return r.ids ? { ids: r.ids, provider: 'openai' } : { error: `openai_http_${r.status}` };
    }
    return { error: 'no_key' };
  } catch (e) {
    return { error: e instanceof Error && e.name === 'TimeoutError' ? 'timeout' : 'request_failed' };
  }
}

export async function POST(req: Request) {
  let text = '';
  try {
    const body = await req.json();
    text = typeof body?.text === 'string' ? body.text.slice(0, 1000) : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (!text.trim()) return NextResponse.json({ symptoms: [], source: 'rules' });

  // Deterministic keyword rules always run so the AI can never suppress a warning sign.
  const ruleIds = extractSymptomsFromText(text);
  const ai = await extractWithAi(text);
  const aiIds = 'ids' in ai ? ai.ids : [];
  const symptoms = Array.from(new Set([...ruleIds, ...aiIds]));
  return NextResponse.json({
    symptoms,
    source: 'ids' in ai ? 'ai+rules' : 'rules',
    provider: 'ids' in ai ? ai.provider : null,
    ai_status: 'ids' in ai ? 'ok' : ai.error, // no secrets; helps diagnose why AI was skipped
  });
}
