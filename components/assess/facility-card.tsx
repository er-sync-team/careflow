'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Car, ChevronDown, Clock, Navigation, Stethoscope, Timer, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MatchResult } from '@/lib/matching';
import type { LatLng } from '@/lib/types';
import type { Copy } from '@/lib/i18n/config';
import { factorLabel, hospitalDistrict, hospitalName, phrase, specialtyLabel } from '@/lib/i18n/terms';
import { useLang } from '@/components/i18n-provider';
import { directionsUrl } from '@/lib/geo';
import { CapacityBar, ScoreRing, StatusPill } from '@/components/shared/badges';

const COPY: Copy<{
  best: string;
  primary: string;
  hospital: string;
  distance: string;
  eta: string;
  wait: string;
  ttc: string;
  km: string;
  min: string;
  available: string;
  notListed: string;
  doctors: (n: number) => string;
  why: string;
  choose: string;
  directions: string;
}> = {
  en: {
    best: 'Best match',
    primary: 'Primary care center',
    hospital: 'Hospital with emergency department',
    distance: 'Distance',
    eta: 'Simulated ETA',
    wait: 'Est. wait',
    ttc: 'Time to care',
    km: 'km',
    min: 'min',
    available: 'available',
    notListed: 'not listed',
    doctors: (n) => `${n} doctors`,
    why: 'Why this facility?',
    choose: 'Choose this facility',
    directions: 'Directions',
  },
  ar: {
    best: 'الأفضل توافقا',
    primary: 'مركز رعاية أولية',
    hospital: 'مستشفى بقسم طوارئ',
    distance: 'المسافة',
    eta: 'وقت الوصول (محاكاة)',
    wait: 'الانتظار المتوقع',
    ttc: 'الوقت حتى الرعاية',
    km: 'كم',
    min: 'دقيقة',
    available: 'متوفرة',
    notListed: 'غير مدرجة',
    doctors: (n) => `${n} أطباء`,
    why: 'لماذا هذه المنشأة؟',
    choose: 'اختر هذه المنشأة',
    directions: 'الاتجاهات',
  },
};

export function FacilityCard({
  result,
  rank,
  specialty,
  origin,
  active,
  rankDelta,
  onHover,
  onChoose,
}: {
  result: MatchResult;
  rank: number;
  specialty: string;
  origin?: LatLng;
  active?: boolean;
  rankDelta?: number;
  onHover?: (id: string | null) => void;
  onChoose?: (r: MatchResult) => void;
}) {
  const { lang } = useLang();
  const t = COPY[lang];
  const [open, setOpen] = useState(rank === 1);
  const h = result.hospital;

  return (
    <article
      onMouseEnter={() => onHover?.(h.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        'animate-fade-up rounded-2xl border bg-white p-5 transition-all duration-300',
        active ? 'border-sky-400 shadow-lg shadow-sky-900/5' : 'border-border hover:border-slate-300 hover:shadow-md',
        rank === 1 && !active && 'border-teal-300',
      )}
    >
      <div className="flex items-start gap-4">
        <ScoreRing score={result.score} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-bold', rank === 1 ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700')}>
              #{rank}
            </span>
            {rank === 1 && <span className="text-xs font-semibold text-teal-700">{t.best}</span>}
            {rankDelta !== undefined && rankDelta !== 0 && (
              <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold', rankDelta > 0 ? 'text-emerald-700' : 'text-red-700')}>
                {rankDelta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(rankDelta)}
              </span>
            )}
            <StatusPill status={h.operational_status} />
          </div>
          <h3 className="mt-1.5 truncate font-display text-lg font-bold text-slate-900">{hospitalName(h, lang)}</h3>
          <p className="text-sm text-slate-500">
            {hospitalDistrict(h, lang)} - {h.facility_type === 'primary_care' ? t.primary : t.hospital}
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Car} label={t.distance} value={`${result.distanceKm.toFixed(1)} ${t.km}`} />
        <Stat icon={Navigation} label={t.eta} value={`${result.etaMinutes} ${t.min}`} />
        <Stat icon={Clock} label={t.wait} value={`${h.wait_minutes} ${t.min}`} />
        <Stat icon={Timer} label={t.ttc} value={`${result.totalTimeMinutes} ${t.min}`} />
      </dl>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm">
          <Stethoscope className={cn('h-4 w-4', result.hasSpecialty ? 'text-teal-600' : 'text-slate-400')} />
          <span className={result.hasSpecialty ? 'text-slate-800' : 'text-slate-500'}>
            {specialtyLabel(specialty, lang)} {result.hasSpecialty ? t.available : t.notListed}
          </span>
          <span className="ms-auto inline-flex items-center gap-1 text-xs text-slate-500 sm:ms-0">
            <UserRound className="h-3 w-3" /> {t.doctors(h.available_doctors)}
          </span>
        </div>
        <CapacityBar occupancy={h.current_occupancy} capacity={h.total_capacity} />
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-4 flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
      >
        {t.why}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <ul className="space-y-1.5 text-sm text-slate-700">
            {result.reasons.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                {phrase(r, lang)}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            {result.factors.map((f) => (
              <div key={f.key} className="text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>
                    {factorLabel(f.key, lang)} <span className="text-slate-400">({Math.round(f.weight * 100)}%)</span>
                  </span>
                  <span className="font-semibold text-slate-800">+{f.points.toFixed(1)}</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-slate-100">
                  <div className="h-1 rounded-full bg-teal-500 transition-all duration-700" style={{ width: `${f.value * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(onChoose || origin) && (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {onChoose && (
            <button
              onClick={() => onChoose(result)}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
            >
              {t.choose}
            </button>
          )}
          <a
            href={directionsUrl({ lat: h.lat, lng: h.lng }, origin)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
          >
            <Navigation className="h-4 w-4" /> {t.directions}
          </a>
        </div>
      )}
    </article>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Car; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <dt className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
        <Icon className="h-3 w-3" /> {label}
      </dt>
      <dd className="mt-0.5 font-display text-sm font-bold text-slate-900">{value}</dd>
    </div>
  );
}
