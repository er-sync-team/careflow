'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, FlaskConical, Loader2, Minus, Radio, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { matchFacilities, type MatchResult } from '@/lib/matching';
import { evaluateTriage } from '@/lib/triage/engine';
import { SPECIALTY_LABELS } from '@/lib/triage/catalog';
import { DEMO_LOCATIONS } from '@/lib/geo';
import { DEMO_FACILITY_LETTERS, DEMO_SCENARIOS, demoHospitalLabel, demoLetter } from '@/lib/demo-scenarios';
import { hospitalName, locationLabel, pathwayLabel, phrase, specialtyLabel as localSpecialty, symptomLabel } from '@/lib/i18n/terms';
import type { Copy } from '@/lib/i18n/config';
import { useCopy, useLang } from '@/components/i18n-provider';
import type { Hospital } from '@/lib/types';
import { useHospitals } from '@/hooks/use-hospitals';
import { cn } from '@/lib/utils';
import { SyntheticTag, UrgencyBadge } from '@/components/shared/badges';
import { FacilityMap } from '@/components/map/facility-map';
import { DemoControls, type Override } from './demo-controls';

const PATIENT = DEMO_SCENARIOS.matching.answers;
const ORIGIN = DEMO_LOCATIONS.find((l) => l.id === PATIENT.locationId)!;
const TRIAGE = evaluateTriage(PATIENT);
const REQUEST = { urgency: TRIAGE.urgency, pathway: TRIAGE.pathway, specialty: TRIAGE.specialty, origin: ORIGIN.coords };
const specialtyLabel = (id: string) => SPECIALTY_LABELS[id] ?? id;
const letterKey = (id: string) => DEMO_FACILITY_LETTERS[id] ?? '?';

const COPY: Copy<{
  liveUpdate: (h: string) => string;
  liveUpdateDesc: string;
  loading: string;
  patient: string;
  patientLine: (age: number, symptoms: string, place: string) => string;
  pathway: string;
  service: string;
  sync: string;
  refresh: string;
  baseline: string;
  whatIfOn: string;
  cols: [string, string, string, string, string, string, string];
  km: string;
  min: string;
  changed: (was: string, now: string) => string;
  current: (now: string) => string;
  none: string;
  simulator: string;
  turnOff: string;
  turnOn: string;
  simulatorHint: string;
  explainer: string;
  excluded: string;
  noChange: string;
  and: string;
}> = {
  en: {
    liveUpdate: (h) => `Live update from ${h}`,
    liveUpdateDesc: 'Rankings were recalculated from the database.',
    loading: 'Loading live facility data...',
    patient: 'Scenario B patient',
    patientLine: (age, symptoms, place) => `${age}-year-old, ${symptoms.toLowerCase()} for a few days, located in ${place}.`,
    pathway: 'Pathway',
    service: 'service',
    sync: 'Real-time sync on',
    refresh: 'Refresh from database',
    baseline: 'Set as new baseline',
    whatIfOn: 'What-if mode: slider changes are local to this screen and are not saved to the database.',
    cols: ['Rank', 'Facility', 'Distance', 'Simulated ETA', 'Waiting time', 'Travel + wait', 'Score'],
    km: 'km',
    min: 'min',
    changed: (was, now) => `Ranking changed since baseline: was ${was}, now ${now}.`,
    current: (now) => `Current order: ${now}. Scores are computed live from the database values shown.`,
    none: 'no eligible facility',
    simulator: 'What-if simulator',
    turnOff: 'Turn off',
    turnOn: 'Turn on',
    simulatorHint: 'Try changes without signing in. Nothing is saved; for the real flow use the facility dashboard.',
    explainer:
      'Eligibility comes first: a facility that is closed, full, missing data or not suitable for the pathway is removed before scoring. Among the remaining facilities, total time to care (simulated travel plus waiting time) carries the most weight, so a nearby facility with a long queue can rank below one that is further away but sees patients sooner.',
    excluded: 'Excluded',
    noChange: 'No change',
    and: ' and ',
  },
  ar: {
    liveUpdate: (h) => `تحديث مباشر من ${h}`,
    liveUpdateDesc: 'تمت إعادة حساب الترتيب من قاعدة البيانات.',
    loading: 'جار تحميل بيانات المنشآت المباشرة...',
    patient: 'مريضة السيناريو ب',
    patientLine: (age, symptoms, place) => `العمر ${age} عاما، ${symptoms} منذ بضعة أيام، الموقع: ${place}.`,
    pathway: 'المسار',
    service: 'الخدمة',
    sync: 'المزامنة المباشرة مفعلة',
    refresh: 'تحديث من قاعدة البيانات',
    baseline: 'اعتماد كنقطة مرجعية جديدة',
    whatIfOn: 'وضع المحاكاة: تغييرات المؤشرات محلية في هذه الشاشة فقط ولا تحفظ في قاعدة البيانات.',
    cols: ['الترتيب', 'المنشأة', 'المسافة', 'مدة الوصول (محاكاة)', 'وقت الانتظار', 'الوصول + الانتظار', 'الدرجة'],
    km: 'كم',
    min: 'دقيقة',
    changed: (was, now) => `تغير الترتيب منذ النقطة المرجعية: كان ${was}، والآن ${now}.`,
    current: (now) => `الترتيب الحالي: ${now}. تحسب الدرجات مباشرة من قيم قاعدة البيانات المعروضة.`,
    none: 'لا توجد منشأة مؤهلة',
    simulator: 'محاكي ماذا لو',
    turnOff: 'إيقاف',
    turnOn: 'تشغيل',
    simulatorHint: 'جرّب التغييرات دون تسجيل الدخول. لا يحفظ أي شيء؛ وللتجربة الحقيقية استخدم لوحة المنشأة.',
    explainer:
      'الأهلية تأتي أولا: تستبعد المنشأة المغلقة أو الممتلئة أو التي تنقصها البيانات أو غير المناسبة للمسار قبل احتساب الدرجات. ومن بين المنشآت المتبقية، يحمل إجمالي الوقت حتى تلقي الرعاية (مدة الوصول المحاكاة مع وقت الانتظار) الوزن الأكبر، لذا قد تأتي منشأة قريبة ذات طابور طويل بعد منشأة أبعد تستقبل المرضى أسرع.',
    excluded: 'مستبعدة',
    noChange: 'دون تغيير',
    and: ' و',
  },
};

function rank(hospitals: Hospital[]) {
  const subset = hospitals.filter((h) => DEMO_FACILITY_LETTERS[h.id]);
  const outcome = matchFacilities(subset, REQUEST, { specialtyLabel });
  return outcome.mode === 'ranked' ? outcome : { ranked: [] as MatchResult[], excluded: [] as MatchResult[] };
}

export function LiveRankingDemo() {
  const { hospitals, loading, error, lastChange, reload, refreshing } = useHospitals();
  const { lang } = useLang();
  const t = useCopy(COPY);
  const letterOf = (id: string) => demoLetter(id, lang) ?? '?';
  const sep = lang === 'ar' ? '، ' : ', ';
  const [baseline, setBaseline] = useState<Hospital[] | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [whatIf, setWhatIf] = useState(false);

  useEffect(() => {
    if (!baseline && hospitals.length) setBaseline(hospitals);
  }, [hospitals, baseline]);

  useEffect(() => {
    if (!lastChange || !DEMO_FACILITY_LETTERS[lastChange.id]) return;
    toast.info(t.liveUpdate(demoHospitalLabel(lastChange.id, lang) ?? ''), { description: t.liveUpdateDesc });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastChange]);

  const effective = useMemo(() => hospitals.map((h) => ({ ...h, ...(whatIf ? overrides[h.id] : undefined) })), [hospitals, overrides, whatIf]);
  const before = useMemo(() => (baseline ? rank(baseline) : null), [baseline]);
  const after = useMemo(() => rank(effective), [effective]);
  const rows = [...after.ranked, ...after.excluded];
  const beforeRank = (id: string) => {
    const i = before?.ranked.findIndex((r) => r.hospital.id === id) ?? -1;
    return i >= 0 ? i + 1 : null;
  };
  const beforeWait = (id: string) => baseline?.find((h) => h.id === id)?.wait_minutes;
  const orderChanged = !!before && before.ranked.map((r) => r.hospital.id).join() !== after.ranked.map((r) => r.hospital.id).join();

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-slate-500" role="status">
        <Loader2 className="h-5 w-5 animate-spin" /> <span className="ms-2 text-sm">{t.loading}</span>
      </div>
    );
  }
  if (error) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800">
        <AlertCircle className="h-4 w-4" /> {phrase(error, lang)}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-2xl border border-border bg-white p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg font-bold text-slate-900">{t.patient}</span>
            <UrgencyBadge urgency={TRIAGE.urgency} />
            <SyntheticTag />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {t.patientLine(PATIENT.age, PATIENT.symptoms.map((s) => symptomLabel(s, lang)).join(t.and), locationLabel(ORIGIN.id, lang))}{' '}
            {t.pathway}: <strong className="text-slate-800">{pathwayLabel(TRIAGE.pathway, lang)}</strong>{sep}{t.service}:{' '}
            <strong className="text-slate-800">{localSpecialty(TRIAGE.specialty, lang)}</strong>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <Radio className="h-3 w-3 animate-pulse" /> {t.sync}
          </span>
          <button
            onClick={() => reload()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} /> {t.refresh}
          </button>
          <button
            onClick={() => setBaseline(hospitals)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" /> {t.baseline}
          </button>
        </div>
      </div>

      {whatIf && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          <FlaskConical className="h-4 w-4 shrink-0" /> {t.whatIfOn}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-start text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {t.cols.map((c, i) => (
                <th key={c} className={cn('px-4 py-3 text-start font-semibold', i === t.cols.length - 1 && 'text-end')}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const now = r.eligible ? after.ranked.indexOf(r) + 1 : null;
              const prev = beforeRank(r.hospital.id);
              const delta = now && prev ? prev - now : 0;
              const prevWait = beforeWait(r.hospital.id);
              return (
                <tr key={r.hospital.id} className={cn('border-t border-border transition-colors', now === 1 && 'bg-teal-50/60')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold', now === 1 ? 'bg-teal-600 text-white' : now ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500')}>
                        {now ? `#${now}` : '-'}
                      </span>
                      <RankDelta delta={delta} excluded={!now} excludedLabel={t.excluded} noChangeLabel={t.noChange} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{demoHospitalLabel(r.hospital.id, lang)}</p>
                    <p className="text-xs text-slate-500">{hospitalName(r.hospital, lang)}</p>
                    {!r.eligible && <p className="mt-1 text-xs text-orange-700">{r.exclusionReasons.map((x) => phrase(x, lang)).join(lang === 'ar' ? '؛ ' : '; ')}</p>}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">{r.distanceKm.toFixed(1)} {t.km}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">{r.etaMinutes} {t.min}</td>
                  <td className="px-4 py-3 tabular-nums">
                    <span className="font-semibold text-slate-900">{r.hospital.wait_minutes} {t.min}</span>
                    {prevWait !== undefined && prevWait !== r.hospital.wait_minutes && <span className="ms-1.5 text-xs text-slate-400 line-through">{prevWait}</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">{r.totalTimeMinutes} {t.min}</td>
                  <td className="px-4 py-3 text-end font-display text-lg font-bold tabular-nums text-slate-900">{r.eligible ? r.score : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className={cn('border-t border-border px-4 py-3 text-sm', orderChanged ? 'bg-teal-50 text-teal-900' : 'text-slate-500')}>
          {orderChanged
            ? t.changed(before!.ranked.map((r) => letterOf(r.hospital.id)).join(sep), after.ranked.map((r) => letterOf(r.hospital.id)).join(sep))
            : t.current(after.ranked.map((r) => letterOf(r.hospital.id)).join(sep) || t.none)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="h-80 overflow-hidden rounded-2xl border border-border">
          <FacilityMap
            className="h-full w-full"
            origin={ORIGIN.coords}
            facilities={[
              ...after.ranked.map((r, i) => ({ hospital: r.hospital, rank: i + 1, eligible: true })),
              ...after.excluded.map((r) => ({ hospital: r.hospital, eligible: false })),
            ]}
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display font-bold text-slate-900">{t.simulator}</p>
            <button
              onClick={() => {
                setWhatIf((v) => !v);
                setOverrides({});
              }}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                whatIf ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              )}
            >
              {whatIf ? t.turnOff : t.turnOn}
            </button>
          </div>
          <p className="text-xs text-slate-500">{t.simulatorHint}</p>
          {whatIf &&
            hospitals
              .filter((h) => DEMO_FACILITY_LETTERS[h.id])
              .sort((a, b) => letterKey(a.id).localeCompare(letterKey(b.id)))
              .map((h) => {
                const i = after.ranked.findIndex((r) => r.hospital.id === h.id);
                return (
                  <DemoControls
                    key={h.id}
                    hospital={{ ...h, name: `${demoHospitalLabel(h.id, lang)} - ${hospitalName(h, lang)}` }}
                    override={overrides[h.id]}
                    rank={i >= 0 ? i + 1 : null}
                    onChange={(o) => setOverrides((prev) => ({ ...prev, [h.id]: o }))}
                  />
                );
              })}
        </div>
      </div>

      <div className="flex gap-3 rounded-2xl bg-navy-900 p-5 text-sm leading-relaxed text-slate-200">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-300" />
        <p>{t.explainer}</p>
      </div>
    </div>
  );
}

function RankDelta({ delta, excluded, excludedLabel, noChangeLabel }: { delta: number; excluded: boolean; excludedLabel: string; noChangeLabel: string }) {
  if (excluded) return <span className="text-xs font-medium text-orange-700">{excludedLabel}</span>;
  if (delta > 0)
    return (
      <span className="inline-flex items-center text-xs font-semibold text-emerald-700">
        <ArrowUp className="h-3.5 w-3.5" />
        {delta}
      </span>
    );
  if (delta < 0)
    return (
      <span className="inline-flex items-center text-xs font-semibold text-red-700">
        <ArrowDown className="h-3.5 w-3.5" />
        {-delta}
      </span>
    );
  return <Minus className="h-3.5 w-3.5 text-slate-300" aria-label={noChangeLabel} />;
}
