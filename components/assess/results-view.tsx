'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ChevronDown, Info, Loader2, Radio, RefreshCw, RotateCcw, Stethoscope, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { matchFacilities, timeSavedVsNearest, type MatchResult } from '@/lib/matching';
import { buildIncomingCase, makeAlias } from '@/lib/cases';
import type { TriageResult } from '@/lib/triage/engine';
import { SPECIALTY_LABELS } from '@/lib/triage/catalog';
import type { Copy } from '@/lib/i18n/config';
import { hospitalName, pathwayLabel, phrase, specialtyLabel, symptomLabel } from '@/lib/i18n/terms';
import { useLang } from '@/components/i18n-provider';
import type { LatLng } from '@/lib/types';
import { useHospitals } from '@/hooks/use-hospitals';
import { cn } from '@/lib/utils';
import { SyntheticTag, UrgencyBadge } from '@/components/shared/badges';
import { FacilityMap } from '@/components/map/facility-map';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FacilityCard } from './facility-card';
import { JourneyView } from './journey-view';
import type { AssessmentDraft } from './assessment-flow';

const COPY: Copy<{
  someFacility: string;
  liveUpdate: (name: string) => string;
  reranked: string;
  unchanged: string;
  refreshed: string;
  orderChanged: string;
  orderSame: string;
  notifyFailed: string;
  preliminary: string;
  primaryModerate: string;
  primaryLow: string;
  emergencyDept: string;
  service: string;
  why: string;
  noWarnings: string;
  recommended: string;
  from: (place: string) => string;
  live: string;
  refresh: string;
  newAssessment: string;
  matching: string;
  noneAvailable: string;
  topOnly: string;
  showAll: (n: number) => string;
  notRecommended: (n: number) => string;
  goTo: (name: string) => string;
  share: string;
  cancel: string;
  confirm: string;
  savedTitle: (min: number) => string;
  savedBody: (nearest: string, km: string, nearestMin: number, best: string, bestMin: number) => string;
  savedNote: string;
}> = {
  en: {
    someFacility: 'A facility',
    liveUpdate: (name) => `Live update: ${name} updated its information.`,
    reranked: 'Your recommendations were re-ranked.',
    unchanged: 'Recommendations recalculated, order unchanged.',
    refreshed: 'Recommendations refreshed from the latest facility data.',
    orderChanged: 'The ranking order changed.',
    orderSame: 'The ranking order is unchanged.',
    notifyFailed: 'We could not notify the facility. Please try again.',
    preliminary: 'Preliminary category for demonstration, not medically validated',
    primaryModerate:
      'A same-day visit to a primary care center or clinic is suggested. If symptoms get worse, go to an emergency department or call 997.',
    primaryLow: 'A primary care center or clinic is a suitable place for this concern. If symptoms get worse, seek urgent care.',
    emergencyDept: 'Please go to an emergency department for prompt evaluation. If symptoms suddenly get worse, call 997.',
    service: 'Suggested service',
    why: 'Why this pathway?',
    noWarnings: 'No emergency warning signs were reported',
    recommended: 'Recommended facilities',
    from: (place) => `From ${place}`,
    live: 'Live re-ranking on',
    refresh: 'Refresh rankings',
    newAssessment: 'New assessment',
    matching: 'Matching facilities',
    noneAvailable: 'No suitable facility is currently available for this pathway. If symptoms are getting worse, call 997.',
    topOnly: 'Show top 3 only',
    showAll: (n) => `Show all ${n} suitable facilities`,
    notRecommended: (n) => `Not recommended for this pathway (${n})`,
    goTo: (name) => `Go to ${name}?`,
    share:
      'We will share a short summary of your assessment (age, sex, symptoms and screening result) with this demonstration facility so the team knows you are on your way. No name or contact details are shared.',
    cancel: 'Cancel',
    confirm: 'Confirm and notify facility',
    savedTitle: (min) => `About ${min} minutes sooner to care`,
    savedBody: (nearest, km, nearestMin, best, bestMin) =>
      `The nearest suitable facility, ${nearest} (${km} km), means about ${nearestMin} min until care (travel + wait). ${best} gets you seen in about ${bestMin} min.`,
    savedNote: 'Simulated estimate from synthetic data.',
  },
  ar: {
    someFacility: 'إحدى المنشآت',
    liveUpdate: (name) => `تحديث مباشر: قامت ${name} بتحديث بياناتها.`,
    reranked: 'تمت إعادة ترتيب التوصيات.',
    unchanged: 'تمت إعادة حساب التوصيات، والترتيب لم يتغير.',
    refreshed: 'تم تحديث التوصيات من أحدث بيانات المنشآت.',
    orderChanged: 'تغير ترتيب المنشآت.',
    orderSame: 'لم يتغير ترتيب المنشآت.',
    notifyFailed: 'تعذر إبلاغ المنشأة. يرجى المحاولة مرة أخرى.',
    preliminary: 'تصنيف أولي لأغراض العرض، غير معتمد طبيا',
    primaryModerate: 'ننصح بزيارة مركز رعاية أولية أو عيادة في اليوم نفسه. إذا ساءت الأعراض، فتوجه إلى قسم الطوارئ أو اتصل بالرقم 997.',
    primaryLow: 'مركز الرعاية الأولية أو العيادة مكان مناسب لهذه الحالة. إذا ساءت الأعراض، فاطلب رعاية عاجلة.',
    emergencyDept: 'يرجى التوجه إلى قسم الطوارئ لتقييم سريع. إذا ساءت الأعراض فجأة، فاتصل بالرقم 997.',
    service: 'الخدمة المقترحة',
    why: 'لماذا هذا المسار؟',
    noWarnings: 'لم يتم الإبلاغ عن أي علامات تحذيرية طارئة',
    recommended: 'المنشآت الموصى بها',
    from: (place) => `من ${place}`,
    live: 'إعادة الترتيب المباشر مفعلة',
    refresh: 'تحديث الترتيب',
    newAssessment: 'تقييم جديد',
    matching: 'جار مطابقة المنشآت',
    noneAvailable: 'لا توجد منشأة مناسبة متاحة حاليا لهذا المسار. إذا كانت الأعراض تزداد سوءا، فاتصل بالرقم 997.',
    topOnly: 'عرض أفضل 3 فقط',
    showAll: (n) => `عرض جميع المنشآت المناسبة (${n})`,
    notRecommended: (n) => `غير موصى بها لهذا المسار (${n})`,
    goTo: (name) => `التوجه إلى ${name}؟`,
    share:
      'سنشارك ملخصا قصيرا لتقييمك (العمر والجنس والأعراض ونتيجة الفحص) مع هذه المنشأة التجريبية ليعلم الفريق أنك في الطريق. لا تتم مشاركة الاسم أو بيانات التواصل.',
    cancel: 'إلغاء',
    confirm: 'تأكيد وإبلاغ المنشأة',
    savedTitle: (min) => `الوصول للرعاية أسرع بحوالي ${min} دقيقة`,
    savedBody: (nearest, km, nearestMin, best, bestMin) =>
      `أقرب منشأة مناسبة هي ${nearest} (${km} كم)، والوقت حتى بدء الرعاية فيها حوالي ${nearestMin} دقيقة (الطريق + الانتظار). أما ${best} فتبدأ رعايتك فيها خلال حوالي ${bestMin} دقيقة.`,
    savedNote: 'تقدير محاكى من بيانات تجريبية.',
  },
};

export function ResultsView({
  draft,
  triage,
  origin,
  onRestart,
}: {
  draft: AssessmentDraft;
  triage: TriageResult;
  origin: { coords: LatLng; label: string };
  onRestart: () => void;
}) {
  const { lang } = useLang();
  const t = COPY[lang];
  const { hospitals, loading, error, lastChange, reload, refreshing } = useHospitals();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showExcluded, setShowExcluded] = useState(false);
  const [pending, setPending] = useState<MatchResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ alias: string; result: MatchResult } | null>(null);
  const prevOrder = useRef<string[]>([]);

  const outcome = useMemo(
    () =>
      matchFacilities(
        hospitals,
        { urgency: triage.urgency, pathway: triage.pathway, specialty: triage.specialty, origin: origin.coords },
        { specialtyLabel: (id) => SPECIALTY_LABELS[id] ?? id },
      ),
    [hospitals, triage, origin.coords],
  );
  const ranked = outcome.mode === 'ranked' ? outcome.ranked : [];
  const excluded = outcome.mode === 'ranked' ? outcome.excluded : [];
  const saved = timeSavedVsNearest(ranked);
  const order = ranked.map((r) => r.hospital.id);

  useEffect(() => {
    if (!lastChange) return;
    const changedHospital = hospitals.find((h) => h.id === lastChange.id);
    const name = changedHospital ? hospitalName(changedHospital, lang) : t.someFacility;
    const changed = prevOrder.current.length > 0 && prevOrder.current.join() !== order.join();
    toast.info(t.liveUpdate(name), { description: changed ? t.reranked : t.unchanged });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastChange]);

  useEffect(() => {
    prevOrder.current = order;
  });

  const refreshBaseline = useRef<string | null>(null);
  const refresh = () => {
    refreshBaseline.current = order.join();
    reload();
  };
  useEffect(() => {
    if (refreshing || refreshBaseline.current === null || error) return;
    toast.success(t.refreshed, { description: refreshBaseline.current !== order.join() ? t.orderChanged : t.orderSame });
    refreshBaseline.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing]);

  const choose = async () => {
    if (!pending) return;
    setSubmitting(true);
    const alias = makeAlias();
    const { error: insertError } = await supabase.from('cases').insert(buildIncomingCase(draft, triage, pending, alias));
    setSubmitting(false);
    if (insertError) {
      toast.error(t.notifyFailed);
      return;
    }
    setConfirmed({ alias, result: pending });
    setPending(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (confirmed) {
    return <JourneyView alias={confirmed.alias} result={confirmed.result} origin={origin.coords} triage={triage} onRestart={onRestart} onBack={() => setConfirmed(null)} />;
  }

  const visible = showAll ? ranked : ranked.slice(0, 3);
  const isPrimary = triage.pathway === 'primary_care';

  return (
    <div className="space-y-8">
      <section className="animate-fade-up overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
        <div className={cn('grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr]', isPrimary ? 'bg-emerald-50/40' : 'bg-orange-50/40')}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <UrgencyBadge urgency={triage.urgency} />
              <span className="text-xs text-slate-500">{t.preliminary}</span>
            </div>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">{pathwayLabel(triage.pathway, lang)}</h2>
            <p className="mt-2 text-slate-600">
              {isPrimary
                ? triage.urgency === 'moderate'
                  ? t.primaryModerate
                  : t.primaryLow
                : t.emergencyDept}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-slate-700 ring-1 ring-border">
                <Stethoscope className="h-3.5 w-3.5 text-primary" /> {t.service}: {specialtyLabel(triage.specialty, lang)}
              </span>
              {draft.symptoms.map((s) => (
                <span key={s} className="rounded-full bg-white px-3 py-1 text-slate-600 ring-1 ring-border">
                  {symptomLabel(s, lang)}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Info className="h-4 w-4 text-primary" /> {t.why}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500" /> {t.noWarnings}
              </li>
              {triage.reasons.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                  {phrase(r, lang)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{t.recommended}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              {t.from(origin.label)} <SyntheticTag />
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <Radio className="h-3.5 w-3.5 animate-pulse" /> {t.live}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={refresh}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-border transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} /> {t.refresh}
            </button>
            <button onClick={onRestart} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
              <RotateCcw className="h-4 w-4" /> {t.newAssessment}
            </button>
          </div>
        </div>

        {saved && (
          <div className="mt-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Timer className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-emerald-900">{t.savedTitle(saved.savedMinutes)}</p>
              <p className="mt-1 text-sm text-emerald-800">
                {t.savedBody(
                  hospitalName(saved.nearest.hospital, lang),
                  saved.nearest.distanceKm.toFixed(1),
                  Math.round(saved.nearest.totalTimeMinutes),
                  hospitalName(saved.best.hospital, lang),
                  Math.round(saved.best.totalTimeMinutes),
                )}
              </p>
              <p className="mt-1 text-xs text-emerald-700/80">{t.savedNote}</p>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-6 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-4 w-4" /> {phrase(error, lang)}
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="h-[340px] overflow-hidden rounded-2xl border border-border lg:sticky lg:top-28 lg:h-[calc(100vh-160px)]">
            <FacilityMap
              className="h-full w-full"
              origin={origin.coords}
              activeId={activeId}
              onSelect={setActiveId}
              facilities={[
                ...ranked.map((r, i) => ({ hospital: r.hospital, rank: i + 1, eligible: true })),
                ...excluded.map((r) => ({ hospital: r.hospital, eligible: false })),
              ]}
            />
          </div>
          <div className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white p-10 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> {t.matching}
              </div>
            )}
            {!loading && !error && ranked.length === 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                {t.noneAvailable}
              </div>
            )}
            {visible.map((r, i) => (
              <FacilityCard
                key={r.hospital.id}
                result={r}
                rank={i + 1}
                specialty={triage.specialty}
                origin={origin.coords}
                active={activeId === r.hospital.id}
                onHover={setActiveId}
                onChoose={setPending}
              />
            ))}
            {ranked.length > 3 && (
              <button
                onClick={() => setShowAll((s) => !s)}
                className="w-full rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-600 hover:bg-white"
              >
                {showAll ? t.topOnly : t.showAll(ranked.length)}
              </button>
            )}
            {excluded.length > 0 && (
              <div className="rounded-2xl border border-border bg-white">
                <button onClick={() => setShowExcluded((s) => !s)} className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-slate-700">
                  {t.notRecommended(excluded.length)}
                  <ChevronDown className={cn('h-4 w-4 transition-transform', showExcluded && 'rotate-180')} />
                </button>
                {showExcluded && (
                  <ul className="divide-y divide-border border-t border-border">
                    {excluded.map((r) => (
                      <li key={r.hospital.id} className="px-5 py-3 text-sm">
                        <p className="font-medium text-slate-800">{hospitalName(r.hospital, lang)}</p>
                        <p className="text-xs text-slate-500">{r.exclusionReasons.map((x) => phrase(x, lang)).join(' - ')}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending && t.goTo(hospitalName(pending.hospital, lang))}</DialogTitle>
            <DialogDescription>
              {t.share}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button onClick={() => setPending(null)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              {t.cancel}
            </button>
            <button
              onClick={choose}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} {t.confirm}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
