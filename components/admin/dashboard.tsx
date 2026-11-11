'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import { Activity, AlertCircle, BedDouble, Clock, ListOrdered, Loader2, LogOut, Stethoscope, UserRound, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { CareCase, CaseStatus, Hospital, Urgency } from '@/lib/types';
import { URGENCY_META } from '@/lib/triage/engine';
import type { Copy } from '@/lib/i18n/config';
import { caseStatusLabel, hospitalDistrict, hospitalName, screeningSummary, sexLabel, specialtyLabel, symptomLabel, urgencyLabel } from '@/lib/i18n/terms';
import { useLang } from '@/components/i18n-provider';
import { cn } from '@/lib/utils';
import { CapacityBar, StatusPill, SyntheticTag, UrgencyBadge } from '@/components/shared/badges';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CaseDetail } from './case-detail';
import { FacilityEditor } from './facility-editor';

const URGENCY_ORDER: Urgency[] = ['emergency', 'high', 'moderate', 'low'];
type FilterId = 'active' | CaseStatus | 'all';
const FILTERS: FilterId[] = ['active', 'incoming', 'arrived', 'in_treatment', 'all'];

const COPY: Copy<{
  waitingList: string;
  all: string;
  loadCases: string;
  loadFacility: string;
  notFound: string;
  newPatient: (alias: string) => string;
  updated: string;
  signOut: string;
  simulated: string;
  incomingNow: (n: number) => string;
  incomingArrived: string;
  estWait: string;
  treatment: (n: number) => string;
  doctors: string;
  onDuty: string;
  capacity: string;
  patients: string;
  settings: string;
  empty: string;
  years: string;
  na: string;
  live: string;
  eta: (n: number) => string;
  priority: string;
  activeCount: (n: number) => string;
  specialties: string;
  noneListed: string;
  recent: string;
  minShort: string;
}> = {
  en: {
    waitingList: 'Waiting list',
    all: 'All',
    loadCases: 'We could not load patient cases.',
    loadFacility: 'We could not load your facility.',
    notFound: 'Facility not found.',
    newPatient: (alias) => `New incoming patient: ${alias}`,
    updated: 'updated',
    signOut: 'Sign out',
    simulated: 'Simulated cases',
    incomingNow: (n) => `${n} incoming now`,
    incomingArrived: 'Incoming + arrived',
    estWait: 'Est. waiting time',
    treatment: (n) => `~${n}m treatment`,
    doctors: 'Doctors available',
    onDuty: 'On duty',
    capacity: 'Capacity',
    patients: 'Patients',
    settings: 'Facility settings',
    empty: 'No patients in this list.',
    years: 'y',
    na: 'n/a',
    live: 'LIVE DEMO',
    eta: (n) => `ETA ${n} min`,
    priority: 'Patient priority',
    activeCount: (n) => `${n} active patients`,
    specialties: 'Available specialties',
    noneListed: 'None listed',
    recent: 'Recent assessment summaries',
    minShort: 'm',
  },
  ar: {
    waitingList: 'قائمة الانتظار',
    all: 'الكل',
    loadCases: 'تعذر تحميل حالات المرضى.',
    loadFacility: 'تعذر تحميل بيانات منشأتك.',
    notFound: 'لم يتم العثور على المنشأة.',
    newPatient: (alias) => `مريض قادم جديد: ${alias}`,
    updated: 'آخر تحديث',
    signOut: 'تسجيل الخروج',
    simulated: 'الحالات التجريبية',
    incomingNow: (n) => `${n} قادمون الآن`,
    incomingArrived: 'القادمون + الواصلون',
    estWait: 'وقت الانتظار المتوقع',
    treatment: (n) => `~${n} د للعلاج`,
    doctors: 'الأطباء المتاحون',
    onDuty: 'في المناوبة',
    capacity: 'السعة',
    patients: 'المرضى',
    settings: 'إعدادات المنشأة',
    empty: 'لا يوجد مرضى في هذه القائمة.',
    years: ' سنة',
    na: 'غير محدد',
    live: 'عرض مباشر',
    eta: (n) => `الوصول خلال ${n} دقيقة`,
    priority: 'أولوية المرضى',
    activeCount: (n) => `${n} مرضى نشطون`,
    specialties: 'التخصصات المتاحة',
    noneListed: 'لا يوجد',
    recent: 'أحدث ملخصات التقييم',
    minShort: ' د',
  },
};

export function Dashboard({ hospitalId, email }: { hospitalId: string; email: string }) {
  const { lang } = useLang();
  const t = COPY[lang];
  const ago = (d: string) => formatDistanceToNow(new Date(d), { addSuffix: true, locale: lang === 'ar' ? arLocale : undefined });
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [cases, setCases] = useState<CareCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const langRef = useRef(lang);
  langRef.current = lang;

  const loadCases = useCallback(async () => {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error || !Array.isArray(data)) {
      setError('cases');
      return;
    }
    setCases(data as CareCase[]);
  }, [hospitalId]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('hospitals').select('*').eq('id', hospitalId).maybeSingle();
      if (error || !data) setError('facility');
      else setHospital(data as Hospital);
      await loadCases();
      setLoading(false);
    })();

    const channel = supabase
      .channel(`cases-${hospitalId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases', filter: `hospital_id=eq.${hospitalId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const c = payload.new as CareCase;
          toast.info(COPY[langRef.current].newPatient(c.patient_alias), { description: c.urgency ? urgencyLabel(c.urgency, langRef.current) : undefined });
        }
        loadCases();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [hospitalId, loadCases]);

  const stats = useMemo(() => {
    const active = cases.filter((c) => ['incoming', 'arrived', 'in_treatment'].includes(c.status));
    const byUrgency = Object.fromEntries(URGENCY_ORDER.map((u) => [u, active.filter((c) => c.urgency === u).length])) as Record<Urgency, number>;
    return {
      total: cases.length,
      incoming: cases.filter((c) => c.status === 'incoming').length,
      waiting: cases.filter((c) => c.status === 'incoming' || c.status === 'arrived').length,
      active: active.length,
      byUrgency,
    };
  }, [cases]);

  const visible = useMemo(() => {
    const list =
      filter === 'all'
        ? cases
        : filter === 'active'
          ? cases.filter((c) => c.status === 'incoming' || c.status === 'arrived')
          : cases.filter((c) => c.status === filter);
    return [...list].sort((a, b) => URGENCY_ORDER.indexOf(a.urgency) - URGENCY_ORDER.indexOf(b.urgency) || b.created_at.localeCompare(a.created_at));
  }, [cases, filter]);

  const selected = cases.find((c) => c.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (error || !hospital) {
    return (
      <p className="mx-auto flex max-w-md items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800">
        <AlertCircle className="h-4 w-4" /> {error === 'cases' ? t.loadCases : error === 'facility' ? t.loadFacility : t.notFound}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={hospital.operational_status} />
            <SyntheticTag />
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{hospitalName(hospital, lang)}</h1>
          <p className="text-sm text-slate-500">
            {hospitalDistrict(hospital, lang)} - {t.updated} {ago(hospital.updated_at)}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span dir="ltr" className="hidden sm:inline">{email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4 rtl:rotate-180" /> {t.signOut}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi icon={Users} label={t.simulated} value={stats.total} sub={t.incomingNow(stats.incoming)} />
        <Kpi icon={ListOrdered} label={t.waitingList} value={stats.waiting} sub={t.incomingArrived} />
        <Kpi icon={Clock} label={t.estWait} value={`${hospital.wait_minutes}${t.minShort}`} sub={t.treatment(hospital.treatment_minutes)} />
        <Kpi icon={UserRound} label={t.doctors} value={hospital.available_doctors} sub={t.onDuty} />
        <div className="col-span-2 rounded-2xl border border-border bg-white p-5 lg:col-span-1">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
            <BedDouble className="h-3.5 w-3.5" /> {t.capacity}
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-900">{Math.round((hospital.current_occupancy / hospital.total_capacity) * 100)}%</p>
          <div className="mt-2">
            <CapacityBar occupancy={hospital.current_occupancy} capacity={hospital.total_capacity} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="patients" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList>
          <TabsTrigger value="patients">{t.patients}</TabsTrigger>
          <TabsTrigger value="facility">{t.settings}</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="overflow-hidden rounded-2xl border border-border bg-white">
              <div className="flex flex-wrap gap-1 border-b border-border p-3">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      filter === f ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    {f === 'active' ? t.waitingList : f === 'all' ? t.all : caseStatusLabel(f, lang)}
                  </button>
                ))}
              </div>
              {visible.length === 0 ? (
                <p className="p-10 text-center text-sm text-slate-500">{t.empty}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {visible.map((c) => (
                    <li key={c.id}>
                      <button onClick={() => setSelectedId(c.id)} className="flex w-full items-center gap-4 px-4 py-3.5 text-start transition-colors hover:bg-slate-50 sm:px-5">
                        <span className={cn('h-10 w-1 shrink-0 rounded-full', URGENCY_META[c.urgency].dot)} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900">{c.patient_alias}</span>
                            <span className="text-xs text-slate-500">
                              {c.age === 0 ? '<1' : c.age}
                              {t.years} - {c.sex === 'unspecified' ? t.na : sexLabel(c.sex, lang)}
                            </span>
                            {!c.is_synthetic && <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">{t.live}</span>}
                          </div>
                          <p className="truncate text-sm text-slate-600">{c.symptoms.map((s) => symptomLabel(s, lang)).join(lang === 'ar' ? '، ' : ', ')}</p>
                        </div>
                        <div className="hidden text-end text-xs text-slate-500 sm:block">
                          <p>{c.eta_minutes != null ? t.eta(c.eta_minutes) : '-'}</p>
                          <p>{ago(c.created_at)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <UrgencyBadge urgency={c.urgency} />
                          <span className="text-xs font-medium text-slate-600">{caseStatusLabel(c.status, lang)}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-border bg-white p-5">
                <p className="flex items-center gap-1.5 font-display font-bold text-slate-900">
                  <Activity className="h-4 w-4 text-primary" /> {t.priority}
                </p>
                <p className="text-xs text-slate-500">{t.activeCount(stats.active)}</p>
                <div className="mt-4 space-y-3">
                  {URGENCY_ORDER.map((u) => (
                    <div key={u}>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-700">{urgencyLabel(u, lang)}</span>
                        <span className="font-semibold text-slate-900">{stats.byUrgency[u]}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                        <div className={cn('h-1.5 rounded-full transition-all', URGENCY_META[u].dot)} style={{ width: `${stats.active ? (stats.byUrgency[u] / stats.active) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5">
                <p className="flex items-center gap-1.5 font-display font-bold text-slate-900">
                  <Stethoscope className="h-4 w-4 text-primary" /> {t.specialties}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {hospital.specialties.length === 0 && <span className="text-sm text-slate-500">{t.noneListed}</span>}
                  {hospital.specialties.map((s) => (
                    <span key={s} className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                      {specialtyLabel(s, lang)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5">
                <p className="font-display font-bold text-slate-900">{t.recent}</p>
                <ul className="mt-3 space-y-3">
                  {cases.slice(0, 4).map((c) => (
                    <li key={c.id}>
                      <button onClick={() => setSelectedId(c.id)} className="text-start">
                        <p className="text-sm font-medium text-slate-800 hover:text-primary">
                          {c.patient_alias} - {urgencyLabel(c.urgency, lang)}
                        </p>
                        <p className="line-clamp-2 text-xs text-slate-500">{c.description || screeningSummary(c.screening_summary, lang)}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="facility" className="mt-4">
          <FacilityEditor hospital={hospital} onSaved={setHospital} />
        </TabsContent>
      </Tabs>

      <CaseDetail
        caseItem={selected}
        hospital={hospital}
        onClose={() => setSelectedId(null)}
        onUpdated={(c) => setCases((prev) => prev.map((x) => (x.id === c.id ? c : x)))}
      />
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}
