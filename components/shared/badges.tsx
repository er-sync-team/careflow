'use client';

import { cn } from '@/lib/utils';
import { URGENCY_META } from '@/lib/triage/engine';
import { capacityLabel } from '@/lib/matching';
import { capacityText, statusLabel, urgencyLabel } from '@/lib/i18n/terms';
import { useLang } from '@/components/i18n-provider';
import type { OperationalStatus, Urgency } from '@/lib/types';

export function UrgencyBadge({ urgency, className }: { urgency: Urgency; className?: string }) {
  const { lang } = useLang();
  const m = URGENCY_META[urgency];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1', m.tone, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} />
      {urgencyLabel(urgency, lang)}
    </span>
  );
}

const STATUS_TONE: Record<OperationalStatus, string> = {
  open: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  limited: 'bg-amber-50 text-amber-800 ring-amber-200',
  diverting: 'bg-orange-50 text-orange-800 ring-orange-200',
  closed: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export const STATUS_OPTIONS = Object.keys(STATUS_TONE) as OperationalStatus[];

export function StatusPill({ status }: { status: OperationalStatus }) {
  const { lang } = useLang();
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1', STATUS_TONE[status])}>{statusLabel(status, lang)}</span>;
}

export function ScoreRing({ score, size = 56, muted = false }: { score: number; size?: number; muted?: boolean }) {
  const { lang } = useLang();
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = muted ? '#94a3b8' : score >= 75 ? '#0d9488' : score >= 55 ? '#0284c7' : '#d97706';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.max(0, Math.min(100, score)) / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.7s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-base font-bold leading-none text-slate-900">{score}</span>
        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500">{lang === 'ar' ? 'توافق' : 'match'}</span>
      </div>
    </div>
  );
}

export function CapacityBar({ occupancy, capacity }: { occupancy: number; capacity: number }) {
  const { lang } = useLang();
  const ratio = capacity > 0 ? occupancy / capacity : 1;
  const label = capacityText(capacityLabel(ratio), lang);
  const color = ratio >= 1 ? 'bg-red-500' : ratio >= 0.85 ? 'bg-orange-500' : ratio >= 0.6 ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          {occupancy}/{capacity} {lang === 'ar' ? 'مستخدم' : 'in use'}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>
    </div>
  );
}

export function SyntheticTag({ className }: { className?: string }) {
  const { lang } = useLang();
  return (
    <span className={cn('inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500', className)}>
      {lang === 'ar' ? 'بيانات تجريبية' : 'Synthetic demo data'}
    </span>
  );
}
