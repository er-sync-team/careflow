'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import type { Copy } from '@/lib/i18n/config';
import { useLang } from '@/components/i18n-provider';
import { encodeWav, resample, toBase64 } from '@/lib/wav';

// --- Mode 1: the browser's own speech recognition (Chrome, Edge) -------------------------------
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

function nativeRecognizer(): RecognizerCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// --- Mode 2: record audio and transcribe on the server with Gemini (Safari, Firefox, others) ----
type AudioCtxCtor = typeof AudioContext;
function audioContextCtor(): AudioCtxCtor | null {
  const w = window as unknown as { AudioContext?: AudioCtxCtor; webkitAudioContext?: AudioCtxCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

const MAX_SECONDS = 20;

type Mode = 'native' | 'record' | null;
type Phase = 'idle' | 'listening' | 'transcribing';

const COPY: Copy<{ start: string; stop: string; listening: string; recording: string; transcribing: string; denied: string; failed: string; empty: string }> = {
  en: {
    start: 'Speak your symptoms',
    stop: 'Stop',
    listening: 'Listening... speak now',
    recording: 'Recording... tap Stop when you finish',
    transcribing: 'Turning your voice into text...',
    denied: 'Microphone permission was not given. You can type instead.',
    failed: 'Could not hear you clearly. Please try again or type instead.',
    empty: 'No speech was detected. Please try again, a little closer to the microphone.',
  },
  ar: {
    start: 'تحدث عن أعراضك',
    stop: 'إيقاف',
    listening: 'جار الاستماع... تحدث الآن',
    recording: 'جار التسجيل... اضغط إيقاف عند الانتهاء',
    transcribing: 'جار تحويل صوتك إلى نص...',
    denied: 'لم يتم السماح باستخدام الميكروفون. يمكنك الكتابة بدلا من ذلك.',
    failed: 'لم نتمكن من سماعك بوضوح. حاول مرة أخرى أو اكتب بدلا من ذلك.',
    empty: 'لم يتم التقاط كلام. حاول مرة أخرى وقرّب الجوال من فمك قليلا.',
  },
};

/**
 * Microphone button that turns speech into text (Arabic or English, following the interface language).
 * Uses built-in speech recognition where available; otherwise records a short clip and transcribes it
 * on the server, so it also works in Safari. Add ?voice=record to the URL to force the recording mode.
 */
export function VoiceInput({ onText }: { onText: (text: string) => void }) {
  const { lang } = useLang();
  const t = COPY[lang];
  const [mode, setMode] = useState<Mode>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognizer | null>(null);
  const stopRecordingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const forceRecord = new URLSearchParams(window.location.search).get('voice') === 'record';
    const canRecord = Boolean(navigator.mediaDevices?.getUserMedia) && audioContextCtor() !== null;
    setMode(!forceRecord && nativeRecognizer() ? 'native' : canRecord ? 'record' : null);
    return () => {
      recRef.current?.stop();
      stopRecordingRef.current?.();
    };
  }, []);

  if (!mode) return null;

  const startNative = () => {
    const Ctor = nativeRecognizer();
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
    rec.onend = () => setPhase('idle');
    recRef.current = rec;
    try {
      rec.start();
      setPhase('listening');
    } catch {
      setError(t.failed);
    }
  };

  const startRecording = async () => {
    const Ctx = audioContextCtor();
    if (!Ctx) return;
    // Create the audio context inside the tap, as Safari requires.
    const ctx = new Ctx();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      void ctx.close();
      setError(t.denied);
      return;
    }
    if (ctx.state === 'suspended') await ctx.resume();
    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    const chunks: Float32Array[] = [];
    processor.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    source.connect(processor);
    processor.connect(ctx.destination);
    setPhase('listening');

    let done = false;
    const timer = window.setTimeout(() => stop(), MAX_SECONDS * 1000);
    const stop = async () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      stopRecordingRef.current = null;
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      const rate = ctx.sampleRate;
      void ctx.close();

      const samples = resample(chunks, rate);
      if (samples.length < 16000 * 0.5) {
        setPhase('idle');
        setError(t.empty);
        return;
      }
      setPhase('transcribing');
      try {
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: toBase64(encodeWav(samples)), lang }),
        });
        const json = res.ok ? await res.json() : null;
        const text = typeof json?.text === 'string' ? json.text.trim() : '';
        if (text) onText(text);
        else setError(res.ok ? t.empty : t.failed);
      } catch {
        setError(t.failed);
      } finally {
        setPhase('idle');
      }
    };
    stopRecordingRef.current = () => void stop();
  };

  const toggle = () => {
    setError(null);
    if (phase === 'listening') {
      if (mode === 'native') recRef.current?.stop();
      else stopRecordingRef.current?.();
      return;
    }
    if (phase === 'transcribing') return;
    if (mode === 'native') startNative();
    else void startRecording();
  };

  const busy = phase === 'transcribing';
  const active = phase === 'listening';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={active}
        className={
          active
            ? 'inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white'
            : 'inline-flex items-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-60'
        }
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {active ? t.stop : t.start}
      </button>
      {active && (
        <span className="flex items-center gap-2 text-sm text-red-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
          </span>
          {mode === 'native' ? t.listening : t.recording}
        </span>
      )}
      {busy && <span className="text-sm text-slate-600">{t.transcribing}</span>}
      {error && <span className="text-sm text-slate-600">{error}</span>}
    </div>
  );
}
