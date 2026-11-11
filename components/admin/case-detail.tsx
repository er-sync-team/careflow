'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { CareCase, CaseStatus, Hospital } from '@/lib/types';
import type { Copy } from '@/lib/i18n/config';
import {
  caseStatusLabel,
  historyLabel,
  hospitalName,
  onsetLabel,
  pathwayLabel,
  phrase,
  screeningSummary,
  severityOption,
  sexLabel,
  specialtyLabel,
  symptomLabel,
} from '@/lib/i18n/terms';
import { useLang } from '@/components/i18n-provider';
import { cn } from '@/lib/utils';
import { SyntheticTag, UrgencyBadge } from '@/components/shared/badges';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

type Action = 'arrive' | 'redirect' | 'treat' | 'discharge';

const NEXT: Record<CaseStatus, { status: CaseStatus; action: Action; note: string }[]> = {
  incoming: [
    { status: 'arrived', action: 'arrive', note: 'Patient checked in at reception' },
    { status: 'redirected', action: 'redirect', note: 'Patient redirected to another facility' },
  ],
  arrived: [
    { status: 'in_treatment', action: 'treat', note: 'Seen by clinician' },
    { status: 'redirected', action: 'redirect', note: 'Patient redirected to another facility' },
  ],
  in_treatment: [{ status: 'discharged', action: 'discharge', note: 'Discharged with follow-up advice' }],
  discharged: [],
  redirected: [],
};

const COPY: Copy<{
  actions: Record<Action, string>;
  updateFailed: string;
  marked: (alias: string, status: string) => string;
  under1: string;
  years: (n: number) => string;
  noSex: string;
  received: string;
  symptoms: string;
  severity: string;
  onset: string;
  history: string;
  noneReported: string;
  screening: string;
  pathway: string;
  service: string;
  facility: string;
  score: string;
  distance: string;
  eta: string;
  km: string;
  min: string;
  notAvailable: string;
  timeline: (status: string) => string;
}> = {
  en: {
    actions: { arrive: 'Mark arrived', redirect: 'Redirect', treat: 'Start treatment', discharge: 'Discharge' },
    updateFailed: 'Could not update the case status.',
    marked: (alias, status) => `${alias} marked as ${status.toLowerCase()}`,
    under1: 'Under 1 year',
    years: (n) => `${n} years`,
    noSex: 'Sex not specified',
    received: 'received',
    symptoms: 'Reported symptoms',
    severity: 'Severity',
    onset: 'Onset',
    history: 'History',
    noneReported: 'None reported',
    screening: 'Initial screening result',
    pathway: 'Suggested pathway',
    service: 'Suggested service',
    facility: 'Selected facility',
    score: 'Match score',
    distance: 'Distance',
    eta: 'ETA (simulated)',
    km: 'km',
    min: 'min',
    notAvailable: 'Not available',
    timeline: (status) => `Case timeline - ${status}`,
  },
  ar: {
    actions: { arrive: 'تسجيل الوصول', redirect: 'إعادة توجيه', treat: 'بدء العلاج', discharge: 'خروج' },
    updateFailed: 'تعذر تحديث حالة المريض.',
    marked: (alias, status) => `تم تحديث حالة ${alias} إلى: ${status}`,
    under1: 'أقل من سنة',
    years: (n) => `${n} سنة`,
    noSex: 'الجنس غير محدد',
    received: 'تم الاستلام',
    symptoms: 'الأعراض المبلغ عنها',
    severity: 'الشدة',
    onset: 'بداية الأعراض',
    history: 'التاريخ الصحي',
    noneReported: 'لا يوجد',
    screening: 'نتيجة الفحص الأولي',
    pathway: 'المسار المقترح',
    service: 'الخدمة المقترحة',
    facility: 'المنشأة المختارة',
    score: 'درجة التوافق',
    distance: 'المسافة',
    eta: 'وقت الوصول (محاكاة)',
    km: 'كم',
    min: 'دقيقة',
    notAvailable: 'غير متوفر',
    timeline: (status) => `مسار الحالة - ${status}`,
  },
};

export function CaseDetail({
  caseItem,
  hospital,
  onClose,
  onUpdated,
}: {
  caseItem: CareCase | null;
  hospital: Hospital;
  onClose: () => void;
  onUpdated: (c: CareCase) => void;
}) {
  const { lang } = useLang();
  const t = COPY[lang];
  const locale = lang === 'ar' ? arLocale : undefined;
  const [busy, setBusy] = useState<CaseStatus | null>(null);

  const advance = async (status: CaseStatus, note: string) => {
    if (!caseItem) return;
    setBusy(status);
    const timeline = [...(caseItem.timeline ?? []), { status, at: new Date().toISOString(), note }];
    const { data, error } = await supabase.from('cases').update({ status, timeline }).eq('id', caseItem.id).select().maybeSingle();
    setBusy(null);
    if (error || !data) {
      toast.error(t.updateFailed);
      return;
    }
    onUpdated(data as CareCase);
    toast.success(t.marked(caseItem.patient_alias, caseStatusLabel(status, lang)));
  };

  return (
    <Sheet open={!!caseItem} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side={lang === 'ar' ? 'left' : 'right'} dir={lang === 'ar' ? 'rtl' : 'ltr'} className="w-full overflow-y-auto sm:max-w-lg">
        {caseItem && (
          <>
            <SheetHeader className="text-start">
              <div className="flex flex-wrap items-center gap-2">
                <UrgencyBadge urgency={caseItem.urgency} />
                <SyntheticTag />
              </div>
              <SheetTitle className="font-display text-2xl">{caseItem.patient_alias}</SheetTitle>
              <SheetDescription>
                {caseItem.age === 0 ? t.under1 : t.years(caseItem.age)} - {caseItem.sex === 'unspecified' ? t.noSex : sexLabel(caseItem.sex, lang)} - {t.received}{' '}
                {format(new Date(caseItem.created_at), 'MMM d, HH:mm', { locale })}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6 text-sm">
              <Section title={t.symptoms}>
                <div className="flex flex-wrap gap-1.5">
                  {caseItem.symptoms.map((s) => (
                    <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                      {symptomLabel(s, lang)}
                    </span>
                  ))}
                </div>
                {caseItem.description && <p className="mt-2 rounded-lg bg-slate-50 p-3 italic text-slate-700">&ldquo;{caseItem.description}&rdquo;</p>}
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <Field label={t.severity} value={severityOption(caseItem.severity, lang).label} />
                  <Field label={t.onset} value={onsetLabel(caseItem.onset, lang)} />
                  <Field
                    label={t.history}
                    value={caseItem.history.length ? caseItem.history.map((h) => historyLabel(h, lang)).join(lang === 'ar' ? '، ' : ', ') : t.noneReported}
                  />
                </dl>
              </Section>

              <Section title={t.screening}>
                <p className="text-slate-700">{screeningSummary(caseItem.screening_summary, lang)}</p>
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <Field label={t.pathway} value={pathwayLabel(caseItem.pathway, lang)} />
                  <Field label={t.service} value={specialtyLabel(caseItem.specialty, lang)} />
                  <Field label={t.facility} value={hospitalName(hospital, lang)} />
                  <Field label={t.score} value={caseItem.match_score != null ? `${caseItem.match_score}/100` : '-'} />
                  <Field label={t.distance} value={caseItem.distance_km != null ? `${Number(caseItem.distance_km).toFixed(1)} ${t.km}` : '-'} />
                  <Field label={t.eta} value={caseItem.eta_minutes != null ? `${caseItem.eta_minutes} ${t.min}` : t.notAvailable} />
                </dl>
              </Section>

              <Section title={t.timeline(caseStatusLabel(caseItem.status, lang))}>
                <ol className="space-y-3">
                  {caseItem.timeline.map((entry, i) => (
                    <li key={`${entry.status}-${i}`} className="flex gap-3">
                      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', i === caseItem.timeline.length - 1 ? 'bg-primary ring-4 ring-teal-100' : 'bg-slate-300')} />
                      <div>
                        <p className="font-medium text-slate-800">
                          {caseStatusLabel(entry.status, lang)}{' '}
                          <span className="font-normal text-slate-500">- {format(new Date(entry.at), 'HH:mm')}</span>
                        </p>
                        <p className="text-xs text-slate-500">{phrase(entry.note, lang)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Section>

              {NEXT[caseItem.status].length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-border pt-5">
                  {NEXT[caseItem.status].map((n) => (
                    <button
                      key={n.status}
                      disabled={!!busy}
                      onClick={() => advance(n.status, n.note)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60',
                        n.status === 'redirected' ? 'border border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-primary text-white hover:bg-teal-800',
                      )}
                    >
                      {busy === n.status && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t.actions[n.action]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}
