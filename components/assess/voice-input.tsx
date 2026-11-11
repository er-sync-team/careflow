'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import type { Copy } from '@/lib/i18n/config';
import { useLang } from '@/components/i18n-provider';

// Minimal typing for the Web Speech API (not in the default TS DOM lib).
interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
interface Recognizer {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognizerCtor = new () => Recognizer;

function getRecognizer(): RecognizerCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const COPY: Copy<{ start: string; stop: string; listening: string; denied: string; failed: string }> = {
  en: {
    start: 'Speak your symptoms',
    stop: 'Stop listening',
    listening: 'Listening... speak now',
    denied: 'Microphone permission was not given. You can type instead.',
    failed: 'Could not hear you clearly. Please try again or type instead.',
  },
  ar: {
    start: 'تحدث عن أعراضك',
    stop: 'إيقاف الاستماع',
    listening: 'جار الاستماع... تحدث الآن',
    denied: 'لم يتم السماح باستخدام الميكروفون. يمكنك الكتابة بدلا من ذلك.',
    failed: 'لم نتمكن من سماعك بوضوح. حاول مرة أخرى أو اكتب بدلا من ذلك.',
  },
};

/**
 * Microphone button that turns speech into text (Arabic or English, following the interface language).
 * Uses the browser's built-in speech recognition, so it renders nothing in browsers without it.
 */
export function VoiceInput({ onText }: { onText: (text: string) => void }) {
  const { lang } = useLang();
  const t = COPY[lang];
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognizer | null>(null);

  useEffect(() => setSupported(getRecognizer() !== null), []);
  useEffect(() => () => recRef.current?.stop(), []);

  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getRecognizer();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) text += e.results[i][0].transcript;
      if (text.trim()) onText(text.trim());
    };
    rec.onerror = (e) => setError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? t.denied : e.error === 'aborted' ? null : t.failed);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setError(null);
    try {
      rec.start();
      setListening(true);
    } catch {
      setError(t.failed);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={listening}
        className={
          listening
            ? 'inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white'
            : 'inline-flex items-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100'
        }
      >
        {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {listening ? t.stop : t.start}
      </button>
      {listening && (
        <span className="flex items-center gap-2 text-sm text-red-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
          </span>
          {t.listening}
        </span>
      )}
      {error && <span className="text-sm text-slate-600">{error}</span>}
    </div>
  );
}
