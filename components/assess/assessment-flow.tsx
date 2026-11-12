'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Phone, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { ONSET_OPTIONS, SEVERITY_OPTIONS, SYMPTOM_LABELS, type ScreeningQuestion } from '@/lib/triage/catalog';
import { detectRedFlags, evaluateTriage, screeningQuestionsFor, type TriageInput, type TriageResult } from '@/lib/triage/engine';
import { scenarioText, type DemoScenario } from '@/lib/demo-scenarios';
import { DEMO_LOCATIONS } from '@/lib/geo';
import type { Copy } from '@/lib/i18n/config';
import { historyLabel, locationLabel, onsetLabel, screeningText, severityOption, sexLabel, symptomLabel } from '@/lib/i18n/terms';
import { useLang } from '@/components/i18n-provider';
import type { LatLng, Onset, Severity, Sex } from '@/lib/types';
import { ChatBubble, OptionButton, TypingIndicator, type ChatMessage } from './chat-ui';
import { AgeInput, HistoryPicker, LocationPicker, SymptomPicker } from './assess-inputs';
import { EmergencyScreen } from './emergency-screen';
import { ResultsView } from './results-view';

type Step = 'consent' | 'age' | 'sex' | 'symptoms' | 'severity' | 'onset' | 'history' | 'screening' | 'location' | 'result' | 'emergency';

export interface AssessmentDraft extends TriageInput {
  description: string;
}

const INITIAL: AssessmentDraft = {
  age: -1,
  sex: 'unspecified',
  symptoms: [],
  severity: 'mild',
  onset: 'today',
  history: [],
  screening: {},
  description: '',
};

const SEX_IDS: Sex[] = ['female', 'male', 'unspecified'];

const COPY: Copy<{
  intro: string[];
  consent: string;
  askAge: string;
  under1: string;
  years: (n: number) => string;
  askSex: string;
  askSymptoms: string;
  noSymptoms: string;
  alsoNoted: (list: string) => string;
  aiPrefix: string;
  askSeverity: string;
  askOnset: string;
  askHistory: string;
  none: string;
  safetyIntro: string;
  yes: string;
  no: string;
  askLocation: string;
  done: string;
  title: string;
  subtitle: string;
  restart: string;
  suggested: string;
  useDemo: string;
  call: string;
  safetyQ: (i: number, n: number) => string;
  yourAnswers: string;
  age: string;
  under1Short: string;
  symptoms: string;
  history: string;
  safetyQuestions: string;
  answered: (n: number) => string;
  notYet: string;
  safetyTitle: string;
  safetyBody: string;
  privacy: string;
  sep: string;
}> = {
  en: {
    intro: [
      "Hi, I'm the CareFlow assistant. I'll ask a few short questions to suggest a suitable place for care.",
      'Before we start: CareFlow does not give medical diagnoses and is not a replacement for emergency services. If you think a life is in danger, call 997 now.',
    ],
    consent: "I understand, let's begin",
    askAge: 'How old is the patient? If you are answering for yourself, enter your own age.',
    under1: 'Under 1 year old',
    years: (n) => `${n} years old`,
    askSex: "What is the patient's sex? This only helps tailor a few questions.",
    askSymptoms: "What's bothering you most? Select everything that applies, or describe it in your own words.",
    noSymptoms: "I couldn't recognize specific symptoms from that description. Please select at least one from the list.",
    alsoNoted: (list) => `From your description I also noted: ${list}.`,
    aiPrefix: '✨ AI-assisted: ',
    askSeverity: 'How severe are the symptoms right now?',
    askOnset: 'When did the symptoms start?',
    askHistory: 'Do any of these apply to the patient?',
    none: 'None of these',
    safetyIntro: 'Thanks. Now a few quick safety questions.',
    yes: 'Yes',
    no: 'No',
    askLocation: 'Last step: where are you right now? This is only used to estimate distance to facilities.',
    done: 'Thank you. Here is your preliminary result and suitable facilities.',
    title: 'Initial assessment',
    subtitle: 'Safety rules are checked after every answer',
    restart: 'Restart',
    suggested: 'suggested answer',
    useDemo: 'Use demo answer',
    call: 'Call 997',
    safetyQ: (i, n) => `Safety question ${i} of ${n}`,
    yourAnswers: 'Your answers',
    age: 'Age',
    under1Short: 'Under 1',
    symptoms: 'Symptoms',
    history: 'History',
    safetyQuestions: 'Safety questions',
    answered: (n) => `${n} answered`,
    notYet: 'Not yet answered',
    safetyTitle: 'Safety first',
    safetyBody:
      'Warning signs are detected by fixed safety rules, not by AI. If one is found, CareFlow stops and shows emergency instructions immediately.',
    privacy: 'No account needed. Your answers are only shared with a facility if you choose one at the end.',
    sep: ', ',
  },
  ar: {
    intro: [
      'مرحبا، أنا مساعد CareFlow. سأطرح عليك بعض الأسئلة القصيرة لاقتراح مكان مناسب لتلقي الرعاية.',
      'قبل أن نبدأ: لا يقدم CareFlow تشخيصا طبيا ولا يغني عن خدمات الطوارئ. إذا كنت تعتقد أن هناك خطرا على الحياة، فاتصل بالرقم 997 الآن.',
    ],
    consent: 'فهمت، لنبدأ',
    askAge: 'كم عمر المريض؟ إذا كنت تجيب عن نفسك، فأدخل عمرك.',
    under1: 'أقل من سنة',
    years: (n) => `${n} سنة`,
    askSex: 'ما جنس المريض؟ يساعد ذلك فقط في تخصيص بعض الأسئلة.',
    askSymptoms: 'ما الذي يزعجك أكثر؟ اختر كل ما ينطبق، أو صفه بكلماتك.',
    noSymptoms: 'لم أتمكن من التعرف على أعراض محددة من هذا الوصف. يرجى اختيار عرض واحد على الأقل من القائمة.',
    alsoNoted: (list) => `لاحظت من وصفك أيضا: ${list}.`,
    aiPrefix: '✨ بمساعدة الذكاء الاصطناعي: ',
    askSeverity: 'ما مدى شدة الأعراض الآن؟',
    askOnset: 'متى بدأت الأعراض؟',
    askHistory: 'هل ينطبق أي مما يلي على المريض؟',
    none: 'لا شيء مما سبق',
    safetyIntro: 'شكرا. والآن بعض أسئلة السلامة السريعة.',
    yes: 'نعم',
    no: 'لا',
    askLocation: 'الخطوة الأخيرة: أين أنت الآن؟ يستخدم هذا فقط لتقدير المسافة إلى المنشآت.',
    done: 'شكرا لك. إليك النتيجة الأولية والمنشآت المناسبة.',
    title: 'التقييم الأولي',
    subtitle: 'يتم التحقق من قواعد السلامة بعد كل إجابة',
    restart: 'إعادة البدء',
    suggested: 'الإجابة المقترحة',
    useDemo: 'استخدم الإجابة التجريبية',
    call: 'اتصل بـ 997',
    safetyQ: (i, n) => `سؤال السلامة ${i} من ${n}`,
    yourAnswers: 'إجاباتك',
    age: 'العمر',
    under1Short: 'أقل من سنة',
    symptoms: 'الأعراض',
    history: 'التاريخ الصحي',
    safetyQuestions: 'أسئلة السلامة',
    answered: (n) => `تمت الإجابة عن ${n}`,
    notYet: 'لم تتم الإجابة بعد',
    safetyTitle: 'السلامة أولا',
    safetyBody:
      'يتم اكتشاف العلامات التحذيرية بواسطة قواعد سلامة ثابتة وليس بالذكاء الاصطناعي. إذا تم العثور على أي منها، يتوقف CareFlow ويعرض تعليمات الطوارئ فورا.',
    privacy: 'لا حاجة لإنشاء حساب. لا تتم مشاركة إجاباتك مع أي منشأة إلا إذا اخترت واحدة في النهاية.',
    sep: '، ',
  },
};

export function AssessmentFlow({ scenario }: { scenario?: DemoScenario }) {
  const { lang } = useLang();
  const t = COPY[lang];
  const symptomList = (ids: string[]) => ids.map((s) => symptomLabel(s, lang)).join(t.sep);
  const historyList = (ids: string[]) => ids.map((h) => historyLabel(h, lang)).join(t.sep);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<Step | null>(null);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState<AssessmentDraft>(INITIAL);
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [flags, setFlags] = useState<string[]>([]);
  const [origin, setOrigin] = useState<{ coords: LatLng; label: string } | null>(null);
  const [result, setResult] = useState<TriageResult | null>(null);
  const idRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const push = (from: ChatMessage['from'], text: string) => setMessages((m) => [...m, { id: ++idRef.current, from, text }]);

  const say = useCallback((texts: string[], next: Step) => {
    setStep(null);
    setTyping(true);
    texts.forEach((text, i) => {
      timers.current.push(
        setTimeout(() => {
          setMessages((m) => [...m, { id: ++idRef.current, from: 'bot', text }]);
          if (i === texts.length - 1) {
            setTyping(false);
            setStep(next);
          }
        }, 600 * (i + 1)),
      );
    });
  }, []);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const introRef = useRef(t.intro);
  useEffect(() => {
    say(introRef.current, 'consent');
    return clearTimers;
  }, [say]);

  // Each new question starts at the top of the answer panel; results and emergency screens start at the top of the page.
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
    if (step === 'result' || step === 'emergency') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing, step]);

  const restart = () => {
    clearTimers();
    setMessages([]);
    setDraft(INITIAL);
    setQuestions([]);
    setQIndex(0);
    setFlags([]);
    setOrigin(null);
    setResult(null);
    say(t.intro, 'consent');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const escalate = (redFlags: string[]) => {
    clearTimers();
    setTyping(false);
    setFlags(redFlags);
    setStep('emergency');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onConsent = () => {
    push('user', t.consent);
    say([t.askAge], 'age');
  };

  const onAge = (age: number) => {
    push('user', age === 0 ? t.under1 : t.years(age));
    setDraft((d) => ({ ...d, age }));
    say([t.askSex], 'sex');
  };

  const onSex = (sex: Sex) => {
    push('user', sexLabel(sex, lang));
    setDraft((d) => ({ ...d, sex }));
    say([t.askSymptoms], 'symptoms');
  };

  const onSymptoms = async (selected: string[], description: string) => {
    let detected: string[] = [];
    let aiUsed = false;
    if (description) {
      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: description }),
        });
        const json = res.ok ? await res.json() : null;
        aiUsed = json?.source === 'ai+rules';
        if (Array.isArray(json?.symptoms)) detected = json.symptoms.filter((s: unknown) => typeof s === 'string' && SYMPTOM_LABELS[s as string]);
      } catch {
        detected = [];
      }
    }
    const merged = Array.from(new Set([...selected, ...detected]));
    push('user', [symptomList(selected), description && `"${description}"`].filter(Boolean).join(' - '));
    if (merged.length === 0) {
      say([t.noSymptoms], 'symptoms');
      return;
    }
    const next = { ...draft, symptoms: merged, description };
    setDraft(next);
    const redFlags = detectRedFlags({ ...next, severity: 'mild', screening: {} });
    if (redFlags.length) return escalate(redFlags);
    const extra = detected.filter((d) => !selected.includes(d));
    say(
      [
        ...(extra.length ? [`${aiUsed ? t.aiPrefix : ''}${t.alsoNoted(symptomList(extra))}`] : []),
        t.askSeverity,
      ],
      'severity',
    );
  };

  const onSeverity = (severity: Severity, label: string) => {
    push('user', label);
    const next = { ...draft, severity };
    setDraft(next);
    const redFlags = detectRedFlags(next);
    if (redFlags.length) return escalate(redFlags);
    say([t.askOnset], 'onset');
  };

  const onOnset = (onset: Onset, label: string) => {
    push('user', label);
    const next = { ...draft, onset };
    setDraft(next);
    const redFlags = detectRedFlags(next);
    if (redFlags.length) return escalate(redFlags);
    say([t.askHistory], 'history');
  };

  const onHistory = (history: string[]) => {
    push('user', history.length ? historyList(history) : t.none);
    const next = { ...draft, history };
    setDraft(next);
    const qs = screeningQuestionsFor(next.symptoms, history);
    setQuestions(qs);
    setQIndex(0);
    say([t.safetyIntro, screeningText(qs[0].id, lang)], 'screening');
  };

  const onScreening = (yes: boolean) => {
    const q = questions[qIndex];
    push('user', yes ? t.yes : t.no);
    const next = { ...draft, screening: { ...draft.screening, [q.id]: yes } };
    setDraft(next);
    if (yes && q.yesLevel === 'emergency') return escalate(detectRedFlags(next));
    if (qIndex + 1 < questions.length) {
      setQIndex(qIndex + 1);
      say([screeningText(questions[qIndex + 1].id, lang)], 'screening');
    } else {
      say([t.askLocation], 'location');
    }
  };

  const onLocation = (coords: LatLng, label: string) => {
    push('user', label);
    setOrigin({ coords, label });
    const r = evaluateTriage(draft);
    if (r.pathway === 'emergency_assistance') return escalate(r.redFlags);
    setResult(r);
    say([t.done], 'result');
  };

  const demoAnswer = (() => {
    if (!scenario || !step) return null;
    const a = scenario.answers;
    const description = lang === 'ar' && a.description ? scenario.ar.description : a.description;
    switch (step) {
      case 'consent':
        return { text: t.consent, run: onConsent };
      case 'age':
        return { text: t.years(a.age), run: () => onAge(a.age) };
      case 'sex':
        return { text: sexLabel(a.sex, lang), run: () => onSex(a.sex) };
      case 'symptoms':
        return {
          text: [symptomList(a.symptoms), description && `"${description}"`].filter(Boolean).join(' - '),
          run: () => onSymptoms(a.symptoms, description),
        };
      case 'severity': {
        const sev = severityOption(a.severity, lang).label;
        return { text: sev, run: () => onSeverity(a.severity, sev) };
      }
      case 'onset': {
        const on = onsetLabel(a.onset, lang);
        return { text: on, run: () => onOnset(a.onset, on) };
      }
      case 'history':
        return { text: a.history.length ? historyList(a.history) : t.none, run: () => onHistory(a.history) };
      case 'screening': {
        const q = questions[qIndex];
        const yes = q ? a.screening[q.id] === true : false;
        return { text: yes ? t.yes : t.no, run: () => onScreening(yes) };
      }
      case 'location': {
        const loc = DEMO_LOCATIONS.find((l) => l.id === a.locationId) ?? DEMO_LOCATIONS[0];
        const locName = locationLabel(loc.id, lang);
        return { text: locName, run: () => onLocation(loc.coords, locName) };
      }
      default:
        return null;
    }
  })();

  if (step === 'emergency') {
    return <EmergencyScreen flags={flags} onRestart={restart} />;
  }

  if (step === 'result' && result && origin) {
    return <ResultsView draft={draft} triage={result} origin={origin} onRestart={restart} />;
  }

  const hidePregnancy = draft.sex === 'male' || draft.age < 12 || draft.age > 55;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex h-[calc(100dvh-150px)] min-h-[460px] flex-col overflow-hidden rounded-3xl border border-border bg-slate-50/60 shadow-sm sm:h-[calc(100vh-180px)] sm:min-h-[560px]">
        <div className="flex items-center justify-between border-b border-border bg-white px-5 py-3">
          <div>
            <p className="font-display font-bold text-slate-900">{t.title}</p>
            <p className="text-xs text-slate-500">{t.subtitle}</p>
          </div>
          <button onClick={restart} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
            <RotateCcw className="h-3.5 w-3.5" /> {t.restart}
          </button>
        </div>
        <div ref={scrollRef} className="min-h-[120px] flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
          {typing && <TypingIndicator />}
        </div>
        <div ref={panelRef} className="max-h-[62%] shrink-0 overflow-y-auto border-t border-border bg-white p-4 sm:p-5">
          {demoAnswer && (
            <div className="mb-3 flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 sm:flex-row sm:items-center">
              <p className="flex-1 text-xs text-sky-900">
                <span className="font-semibold">{scenario && scenarioText(scenario, lang).title}:</span> {t.suggested} &ldquo;{demoAnswer.text}&rdquo;
              </p>
              <button
                onClick={demoAnswer.run}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
              >
                <Sparkles className="h-3.5 w-3.5" /> {t.useDemo}
              </button>
            </div>
          )}
          {step === null && <p className="py-2 text-center text-sm text-slate-400">...</p>}
          {step === 'consent' && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={onConsent}
                className="flex-1 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
              >
                {t.consent}
              </button>
              <a href="tel:997" className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700">
                <Phone className="h-4 w-4" /> {t.call}
              </a>
            </div>
          )}
          {step === 'age' && <AgeInput onSubmit={onAge} />}
          {step === 'sex' && (
            <div className="grid gap-2 sm:grid-cols-3">
              {SEX_IDS.map((id) => (
                <OptionButton key={id} title={sexLabel(id, lang)} onClick={() => onSex(id)} />
              ))}
            </div>
          )}
          {step === 'symptoms' && <SymptomPicker onSubmit={onSymptoms} />}
          {step === 'severity' && (
            <div className="grid gap-2 sm:grid-cols-3">
              {SEVERITY_OPTIONS.map((o) => {
                const opt = severityOption(o.id, lang);
                return <OptionButton key={o.id} title={opt.label} hint={opt.hint} onClick={() => onSeverity(o.id, opt.label)} />;
              })}
            </div>
          )}
          {step === 'onset' && (
            <div className="grid gap-2 sm:grid-cols-2">
              {ONSET_OPTIONS.map((o) => (
                <OptionButton key={o.id} title={onsetLabel(o.id, lang)} onClick={() => onOnset(o.id, onsetLabel(o.id, lang))} />
              ))}
            </div>
          )}
          {step === 'history' && <HistoryPicker hidePregnancy={hidePregnancy} onSubmit={onHistory} />}
          {step === 'screening' && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500">
                {t.safetyQ(qIndex + 1, questions.length)}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <OptionButton title={t.yes} onClick={() => onScreening(true)} />
                <OptionButton title={t.no} onClick={() => onScreening(false)} />
              </div>
            </div>
          )}
          {step === 'location' && <LocationPicker onSubmit={onLocation} />}
        </div>
      </div>

      <aside className="hidden space-y-4 lg:block">
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="font-display font-bold text-slate-900">{t.yourAnswers}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <Row empty={t.notYet} label={t.age} value={draft.age < 0 ? null : draft.age === 0 ? t.under1Short : String(draft.age)} />
            <Row empty={t.notYet} label={t.symptoms} value={draft.symptoms.length ? symptomList(draft.symptoms) : null} />
            <Row empty={t.notYet} label={t.history} value={draft.history.length ? historyList(draft.history) : null} />
            <Row empty={t.notYet} label={t.safetyQuestions} value={Object.keys(draft.screening).length ? t.answered(Object.keys(draft.screening).length) : null} />
          </dl>
        </div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 text-sm text-teal-900">
          <ShieldCheck className="h-5 w-5 text-teal-700" />
          <p className="mt-2 font-semibold">{t.safetyTitle}</p>
          <p className="mt-1 text-teal-800">{t.safetyBody}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 text-xs text-slate-500">
          {t.privacy}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, empty }: { label: string; value: string | null; empty: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={value ? 'mt-0.5 text-slate-800' : 'mt-0.5 text-slate-400'}>{value ?? empty}</dd>
    </div>
  );
}
