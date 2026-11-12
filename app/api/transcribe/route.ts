import { NextResponse } from 'next/server';

// Speech-to-text for browsers without built-in speech recognition (e.g. Safari):
// the browser records a short WAV clip and Gemini transcribes it. The API key stays on the server.

const MODELS = [process.env.GEMINI_MODEL, 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.5-flash'].filter(
  (m): m is string => Boolean(m),
);
const MAX_BASE64 = 2_800_000; // ~2 MB of audio, about a minute at 16 kHz mono

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: 'no_key' }, { status: 503 });

  let audio = '';
  let lang: 'ar' | 'en' = 'en';
  try {
    const body = await req.json();
    audio = typeof body?.audio === 'string' ? body.audio : '';
    lang = body?.lang === 'ar' ? 'ar' : 'en';
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  if (!audio || audio.length > MAX_BASE64 || !/^[A-Za-z0-9+/=]+$/.test(audio.slice(0, 200))) {
    return NextResponse.json({ error: 'bad_audio' }, { status: 400 });
  }

  const prompt =
    `Transcribe this short voice note from a patient describing symptoms. The speaker most likely uses ${lang === 'ar' ? 'Arabic (any dialect, often Saudi)' : 'English'}, ` +
    'but write exactly what is said in the language spoken. Output only the transcript text, with no quotes, labels or translation. ' +
    'If there is no clear speech, output nothing.';

  let last = 0;
  for (const model of MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: 'audio/wav', data: audio } }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 300 },
        }),
        signal: AbortSignal.timeout(15000),
      });
      last = res.status;
      if (!res.ok) {
        if (res.status === 404 || res.status === 400) continue; // try the next model name
        break;
      }
      const json = await res.json();
      const text = String(json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '')
        .trim()
        .slice(0, 1000);
      return NextResponse.json({ text });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error && e.name === 'TimeoutError' ? 'timeout' : 'request_failed' }, { status: 502 });
    }
  }
  return NextResponse.json({ error: `gemini_http_${last}` }, { status: 502 });
}
