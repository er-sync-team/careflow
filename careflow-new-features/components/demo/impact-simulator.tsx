'use client';

import { useMemo, useState } from 'react';
import { BarChart3, Clock, Dices, Loader2, Route, Stethoscope, TimerOff } from 'lucide-react';
import { simulateImpact } from '@/lib/impact';
import type { Copy } from '@/lib/i18n/config';
import { useCopy } from '@/components/i18n-provider';
import { useHospitals } from '@/hooks/use-hospitals';
import { SyntheticTag } from '@/components/shared/badges';

const PATIENTS = 100;

const COPY: Copy<{
  eyebrow: string;
  title: string;
  intro: string;
  loading: string;
  error: string;
  saved: string;
  savedSub: (nearest: number, recommended: number) => string;
  notNearest: string;
  notNearestSub: string;
  longWait: string;
  longWaitSub: string;
  specialty: string;
  specialtySub: string;
  total: (min: number, patients: number) => string;
  rerun: string;
  method: string;
  min: string;
}> = {
  en: {
    eyebrow: 'Impact simulation',
    title: `What happens across ${PATIENTS} patients?`,
    intro:
      'We generate 100 synthetic, non-emergency patients across Jeddah districts and run each one through the same matching algorithm, using the live facility data. We compare the recommendation with the simple alternative: going to the nearest suitable facility.',
    loading: 'Running the simulation...',
    error: 'Facility data could not be loaded, so the simulation cannot run.',
    saved: 'Sooner to care, on average',
    savedSub: (n, r) => `Time to care (travel + wait): ${n} min at the nearest facility vs ${r} min with CareFlow`,
    notNearest: 'Sent somewhere better than the nearest',
    notNearestSub: 'Patients whose best option was not the closest facility',
    longWait: 'Kept away from a 60+ min wait',
    longWaitSub: 'The nearest facility had a long wait; CareFlow found a shorter one',
    specialty: 'Matched to the right service',
    specialtySub: 'Recommended facility offers the suggested service',
    total: (m, p) => `${m.toLocaleString('en')} minutes saved in total across ${p} patients.`,
    rerun: 'Run with new patients',
    method: 'Simulation only: synthetic patients and facilities, simulated travel times. It shows how the algorithm behaves, not clinical outcomes.',
    min: 'min',
  },
  ar: {
    eyebrow: 'محاكاة الأثر',
    title: `ماذا يحدث عند ${PATIENTS} مريض؟`,
    intro:
      'ننشئ 100 مريض افتراضي بحالات غير طارئة من أحياء مختلفة في جدة، ونمرر كل مريض على نفس خوارزمية الترشيح باستخدام بيانات المنشآت المباشرة، ثم نقارن التوصية بالبديل البسيط: الذهاب إلى أقرب منشأة مناسبة.',
    loading: 'جار تشغيل المحاكاة...',
    error: 'تعذر تحميل بيانات المنشآت، لذلك لا يمكن تشغيل المحاكاة.',
    saved: 'وصول أسرع للرعاية في المتوسط',
    savedSub: (n, r) => `الوقت حتى بدء الرعاية (الطريق + الانتظار): ${n} دقيقة في أقرب منشأة مقابل ${r} دقيقة مع CareFlow`,
    notNearest: 'وُجّهوا لخيار أفضل من الأقرب',
    notNearestSub: 'مرضى لم يكن أقرب مكان هو أفضل خيار لهم',
    longWait: 'تجنبوا انتظارا يزيد عن 60 دقيقة',
    longWaitSub: 'أقرب منشأة كان انتظارها طويلا، ووجد CareFlow خيارا أقصر',
    specialty: 'وُجّهوا للخدمة المناسبة',
    specialtySub: 'المنشأة الموصى بها توفر الخدمة المقترحة',
    total: (m, p) => `إجمالي ${m.toLocaleString('ar')} دقيقة تم توفيرها لـ ${p} مريض.`,
    rerun: 'تشغيل بمرضى جدد',
    method: 'محاكاة فقط: مرضى ومنشآت افتراضية وأوقات وصول محاكاة. توضح سلوك الخوارزمية وليست نتائج سريرية.',
    min: 'دقيقة',
  },
};

export function ImpactSimulator() {
  const t = useCopy(COPY);
  const { hospitals, loading, error } = useHospitals();
  const [seed, setSeed] = useState(2026);
  const s = useMemo(() => (hospitals.length ? simulateImpact(hospitals, PATIENTS, seed) : null), [hospitals, seed]);

  const tiles = s
    ? [
        { icon: Clock, value: `${s.avgMinutesSaved} ${t.min}`, label: t.saved, sub: t.savedSub(s.avgTimeToCareNearest, s.avgTimeToCareRecommended), tone: 'bg-emerald-600' },
        { icon: Route, value: `${s.pctNotNearest}%`, label: t.notNearest, sub: t.notNearestSub, tone: 'bg-sky-600' },
        { icon: TimerOff, value: `${s.pctAvoidedLongWait}%`, label: t.longWait, sub: t.longWaitSub, tone: 'bg-amber-500' },
        { icon: Stethoscope, value: `${s.pctSpecialtyMatch}%`, label: t.specialty, sub: t.specialtySub, tone: 'bg-teal-600' },
      ]
    : [];

  return (
    <div className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <BarChart3 className="h-3.5 w-3.5" /> {t.eyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-slate-900">{t.title}</h2>
          <p className="mt-2 text-slate-600">{t.intro}</p>
        </div>
        <button
          type="button"
          onClick={() => setSeed((n) => n + 1)}
          disabled={!s}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <Dices className="h-4 w-4" /> {t.rerun}
        </button>
      </div>

      {loading && (
        <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> {t.loading}
        </p>
      )}
      {!loading && (error || !s) && <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{t.error}</p>}

      {s && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map(({ icon: Icon, value, label, sub, tone }) => (
              <div key={label} className="rounded-2xl border border-border bg-slate-50 p-5">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-3 font-display text-3xl font-bold text-slate-900">{value}</p>
                <p className="mt-1 font-semibold text-slate-800">{label}</p>
                <p className="mt-1 text-xs text-slate-500">{sub}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 font-semibold text-emerald-800">{t.total(s.totalMinutesSaved, s.matched)}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <SyntheticTag /> {t.method}
          </p>
        </>
      )}
    </div>
  );
}
