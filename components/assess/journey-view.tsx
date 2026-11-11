'use client';

import { ArrowLeft, Building2, Check, Clock, ExternalLink, FileText, Navigation, Phone, RotateCcw } from 'lucide-react';
import { DEMO_ADMIN_PASSWORD, demoAdminEmail } from '@/lib/demo-scenarios';
import type { MatchResult } from '@/lib/matching';
import type { TriageResult } from '@/lib/triage/engine';
import type { Copy } from '@/lib/i18n/config';
import { hospitalName, pathwayLabel } from '@/lib/i18n/terms';
import { useLang } from '@/components/i18n-provider';
import type { LatLng } from '@/lib/types';
import { directionsUrl } from '@/lib/geo';
import { cn } from '@/lib/utils';
import { SyntheticTag, UrgencyBadge } from '@/components/shared/badges';

const COPY: Copy<{
  steps: (p: { pathway: string; name: string; eta: number; alias: string; wait: number }) => { title: string; text: string }[];
  onWay: (name: string) => string;
  received: string;
  reference: string;
  navigate: string;
  worse: string;
  journey: string;
  distance: string;
  eta: string;
  score: string;
  km: string;
  min: string;
  demoEyebrow: string;
  onDashboard: (alias: string, name: string) => string;
  demoBody: string;
  email: string;
  password: string;
  open: (name: string) => string;
  signOut: string;
  before: string;
  tips: string[];
  back: string;
  restart: string;
}> = {
  en: {
    steps: ({ pathway, name, eta, alias, wait }) => [
      { title: 'Assessment completed', text: `${pathway} suggested` },
      { title: 'Facility notified', text: `${name} can see your summary` },
      { title: 'Travel to facility', text: `About ${eta} min (simulated ETA, not live traffic)` },
      { title: 'Check in at reception', text: `Mention your reference ${alias}` },
      { title: 'Assessment by clinician', text: `Estimated wait on arrival ~${wait} min` },
    ],
    onWay: (name) => `You're on your way to ${name}`,
    received: 'The facility has received your assessment summary and is expecting you.',
    reference: 'Reference',
    navigate: 'Open navigation',
    worse: 'Symptoms worse? Call 997',
    journey: 'Your care journey',
    distance: 'Distance',
    eta: 'Simulated ETA',
    score: 'Match score',
    km: 'km',
    min: 'min',
    demoEyebrow: 'Demo: see the hospital side',
    onDashboard: (alias, name) => `${alias} is now on the ${name} dashboard`,
    demoBody:
      'Open the facility dashboard in a new tab, find the incoming case, then change the waiting time or capacity in Facility settings. Come back here and use "Back to live recommendations" to watch the ranking update.',
    email: 'Demo admin email',
    password: 'Demo password',
    open: (name) => `Open ${name} dashboard`,
    signOut: 'If you are already signed in as another facility there, sign out first.',
    before: 'Before you leave',
    tips: [
      'Bring your ID, insurance card and a list of current medicines.',
      'Do not drive yourself if you feel faint, confused or in severe pain.',
      'Waiting times are synthetic demo estimates and may differ on arrival.',
    ],
    back: 'Back to live recommendations',
    restart: 'Start a new assessment',
  },
  ar: {
    steps: ({ pathway, name, eta, alias, wait }) => [
      { title: 'اكتمل التقييم', text: `المسار المقترح: ${pathway}` },
      { title: 'تم إبلاغ المنشأة', text: `يمكن لـ ${name} الاطلاع على ملخصك` },
      { title: 'التوجه إلى المنشأة', text: `حوالي ${eta} دقيقة (وقت وصول تقديري، وليس حركة مرور مباشرة)` },
      { title: 'التسجيل في الاستقبال', text: `اذكر رقمك المرجعي ${alias}` },
      { title: 'التقييم من قبل الطبيب', text: `الانتظار المتوقع عند الوصول ~${wait} دقيقة` },
    ],
    onWay: (name) => `أنت في طريقك إلى ${name}`,
    received: 'استلمت المنشأة ملخص تقييمك وهي بانتظارك.',
    reference: 'الرقم المرجعي',
    navigate: 'افتح الملاحة',
    worse: 'ساءت الأعراض؟ اتصل بـ 997',
    journey: 'رحلة رعايتك',
    distance: 'المسافة',
    eta: 'وقت الوصول (محاكاة)',
    score: 'درجة التوافق',
    km: 'كم',
    min: 'دقيقة',
    demoEyebrow: 'عرض تجريبي: شاهد جهة المستشفى',
    onDashboard: (alias, name) => `${alias} يظهر الآن في لوحة تحكم ${name}`,
    demoBody:
      'افتح لوحة تحكم المنشأة في علامة تبويب جديدة، وابحث عن الحالة القادمة، ثم غير وقت الانتظار أو السعة من إعدادات المنشأة. عد إلى هنا واستخدم "العودة إلى التوصيات المباشرة" لمشاهدة تحديث الترتيب.',
    email: 'البريد الإلكتروني للمسؤول التجريبي',
    password: 'كلمة المرور التجريبية',
    open: (name) => `افتح لوحة تحكم ${name}`,
    signOut: 'إذا كنت مسجلا الدخول كمنشأة أخرى هناك، فسجل الخروج أولا.',
    before: 'قبل أن تغادر',
    tips: [
      'أحضر الهوية وبطاقة التأمين وقائمة بالأدوية الحالية.',
      'لا تقد السيارة بنفسك إذا شعرت بدوار أو ارتباك أو ألم شديد.',
      'أوقات الانتظار تقديرات تجريبية وقد تختلف عند الوصول.',
    ],
    back: 'العودة إلى التوصيات المباشرة',
    restart: 'ابدأ تقييما جديدا',
  },
};

export function JourneyView({
  alias,
  result,
  origin,
  triage,
  onRestart,
  onBack,
}: {
  alias: string;
  result: MatchResult;
  origin: LatLng;
  triage: TriageResult;
  onRestart: () => void;
  onBack: () => void;
}) {
  const { lang } = useLang();
  const t = COPY[lang];
  const h = result.hospital;
  const name = hospitalName(h, lang);
  const steps = t
    .steps({ pathway: pathwayLabel(triage.pathway, lang), name, eta: result.etaMinutes, alias, wait: h.wait_minutes })
    .map((s, i) => ({ ...s, done: i < 2, current: i === 2 }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="animate-fade-up rounded-3xl border border-teal-200 bg-white p-6 shadow-sm sm:p-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg shadow-teal-900/20">
          <Check className="h-7 w-7" />
        </span>
        <h2 className="mt-6 text-3xl font-bold text-slate-900">{t.onWay(name)}</h2>
        <p className="mt-2 text-slate-600">{t.received}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm">
            <FileText className="h-4 w-4 text-slate-500" /> {t.reference} <strong className="font-mono">{alias}</strong>
          </span>
          <UrgencyBadge urgency={triage.urgency} />
          <SyntheticTag />
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={directionsUrl({ lat: h.lat, lng: h.lng }, origin)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-semibold text-white transition-colors hover:bg-teal-800"
          >
            <Navigation className="h-4 w-4" /> {t.navigate}
          </a>
          <a href="tel:997" className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 font-semibold text-red-700 hover:bg-red-100">
            <Phone className="h-4 w-4" /> {t.worse}
          </a>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-white p-6 sm:p-8">
        <h3 className="font-display text-lg font-bold text-slate-900">{t.journey}</h3>
        <ol className="mt-6 space-y-0">
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
              {i < steps.length - 1 && <span className={cn('absolute start-[15px] top-8 h-[calc(100%-24px)] w-0.5', s.done ? 'bg-teal-500' : 'bg-slate-200')} />}
              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                  s.done ? 'border-teal-600 bg-teal-600 text-white' : s.current ? 'border-sky-500 bg-white text-sky-600' : 'border-slate-200 bg-white text-slate-400',
                )}
              >
                {s.done ? <Check className="h-4 w-4" /> : s.current ? <Clock className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                {s.current && <span className="absolute inset-0 animate-ping rounded-full border-2 border-sky-400" />}
              </span>
              <div>
                <p className={cn('font-semibold', s.done || s.current ? 'text-slate-900' : 'text-slate-500')}>{s.title}</p>
                <p className="text-sm text-slate-500">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          [t.distance, `${result.distanceKm.toFixed(1)} ${t.km}`],
          [t.eta, `${result.etaMinutes} ${t.min}`],
          [t.score, `${result.score}/100`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-border bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{k}</p>
            <p className="mt-1 font-display text-2xl font-bold text-slate-900">{v}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 sm:p-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-800">
          <Building2 className="h-4 w-4" /> {t.demoEyebrow}
        </p>
        <h3 className="mt-2 font-display text-lg font-bold text-slate-900">{t.onDashboard(alias, name)}</h3>
        <p className="mt-1 text-sm text-slate-700">
          {t.demoBody}
        </p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-white px-4 py-2.5 ring-1 ring-sky-100">
            <dt className="text-xs text-slate-500">{t.email}</dt>
            <dd dir="ltr" className="break-all text-start font-mono text-slate-900 rtl:text-end">{demoAdminEmail(h.id)}</dd>
          </div>
          <div className="rounded-xl bg-white px-4 py-2.5 ring-1 ring-sky-100">
            <dt className="text-xs text-slate-500">{t.password}</dt>
            <dd dir="ltr" className="text-start font-mono text-slate-900 rtl:text-end">{DEMO_ADMIN_PASSWORD}</dd>
          </div>
        </dl>
        <a
          href={`/admin?facility=${h.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-800"
        >
          {t.open(name)} <ExternalLink className="h-4 w-4" />
        </a>
        <p className="mt-2 text-xs text-slate-600">{t.signOut}</p>
      </section>

      <section className="rounded-3xl border border-border bg-slate-50 p-6 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">{t.before}</p>
        <ul className="mt-3 list-disc space-y-1 ps-5">
          {t.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t.back}
          </button>
          <button onClick={onRestart} className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-slate-900">
            <RotateCcw className="h-4 w-4" /> {t.restart}
          </button>
        </div>
      </section>
    </div>
  );
}
