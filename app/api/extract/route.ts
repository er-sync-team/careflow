import { NextResponse } from 'next/server';
import { SYMPTOMS, extractSymptomsFromText } from '@/lib/triage/catalog';

const VALID_IDS = new Set(SYMPTOMS.map((s) => s.id));

type AiProvider = { name: 'gemini' | 'openai'; url: string; key: string; model: string };

/** Gemini (free tier) is preferred; OpenAI is used only if no Gemini key is set. Both use the same chat-completions format. */
function getProvider(): AiProvider | null {
  if (process.env.GEMINI_API_KEY) {
    return {
      name: 'gemini',
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      key: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      name: 'openai',
      url: 'https://api.openai.com/v1/chat/completions',
      key: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    };
  }
  return null;
}

async function extractWithAi(text: string): Promise<{ ids: string[]; provider: AiProvider['name'] } | null> {
  const provider = getProvider();
  if (!provider) return null;
  try {
    const res = await fetch(provider.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${provider.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You extract symptoms from patient text, which may be written in Arabic (any dialect) or English. ' +
              'Reply only with JSON {"symptoms": string[]} using ONLY these ids: ' +
              SYMPTOMS.map((s) => `${s.id} (${s.label})`).join(', ') +
              '. Include every symptom that is mentioned or clearly described. Do not diagnose. Do not judge urgency.',
          },
          { role: 'user', content: text },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = String(json?.choices?.[0]?.message?.content ?? '{}').replace(/^```(?:json)?\s*|\s*```$/g, '');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.symptoms)) return null;
    const ids = parsed.symptoms.filter((s: unknown): s is string => typeof s === 'string' && VALID_IDS.has(s));
    return { ids, provider: provider.name };
  } catch {
    return null;
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
  const symptoms = Array.from(new Set([...ruleIds, ...(ai?.ids ?? [])]));
  return NextResponse.json({ symptoms, source: ai ? 'ai+rules' : 'rules', provider: ai?.provider ?? null });
}
