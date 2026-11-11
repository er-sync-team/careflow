'use client';

import { Slider } from '@/components/ui/slider';
import type { Hospital, OperationalStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { STATUS_OPTIONS } from '@/components/shared/badges';
import { statusLabel } from '@/lib/i18n/terms';
import { dirOf, type Copy } from '@/lib/i18n/config';
import { useCopy, useLang } from '@/components/i18n-provider';

const COPY: Copy<{ excluded: string; wait: string; min: string; occupancy: string; short: Partial<Record<OperationalStatus, string>> }> = {
  en: { excluded: 'Excluded', wait: 'Waiting time', min: 'min', occupancy: 'Occupancy', short: { diverting: 'Divert', limited: 'Limited' } },
  ar: { excluded: 'مستبعدة', wait: 'وقت الانتظار', min: 'دقيقة', occupancy: 'الإشغال', short: { diverting: 'تحويل', limited: 'محدود' } },
};

export type Override = Partial<Pick<Hospital, 'wait_minutes' | 'current_occupancy' | 'operational_status'>>;

export function DemoControls({
  hospital,
  override,
  rank,
  onChange,
}: {
  hospital: Hospital;
  override: Override | undefined;
  rank: number | null;
  onChange: (o: Override) => void;
}) {
  const wait = override?.wait_minutes ?? hospital.wait_minutes;
  const occ = override?.current_occupancy ?? hospital.current_occupancy;
  const status = override?.operational_status ?? hospital.operational_status;
  const { lang } = useLang();
  const t = useCopy(COPY);
  const changed = !!override && Object.keys(override).length > 0;

  return (
    <div className={cn('rounded-2xl border bg-white p-4 transition-colors', changed ? 'border-amber-300 bg-amber-50/40' : 'border-border')}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-semibold text-slate-900">{hospital.name}</p>
        <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-xs font-bold', rank ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500')}>
          {rank ? `#${rank}` : t.excluded}
        </span>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="flex justify-between text-xs">
            <span className="font-medium text-slate-600">{t.wait}</span>
            <span className="font-semibold text-slate-900">{wait} {t.min}</span>
          </div>
          <Slider dir={dirOf(lang)} className="mt-2" min={0} max={180} step={5} value={[wait]} onValueChange={([v]) => onChange({ ...override, wait_minutes: v })} />
        </div>
        <div>
          <div className="flex justify-between text-xs">
            <span className="font-medium text-slate-600">{t.occupancy}</span>
            <span className="font-semibold text-slate-900">
              {occ}/{hospital.total_capacity}
            </span>
          </div>
          <Slider
            dir={dirOf(lang)}
            className="mt-2"
            min={0}
            max={hospital.total_capacity}
            step={1}
            value={[occ]}
            onValueChange={([v]) => onChange({ ...override, current_occupancy: v })}
          />
        </div>
        <div className="grid grid-cols-4 gap-1">
          {STATUS_OPTIONS.map((id) => (
            <button
              key={id}
              onClick={() => onChange({ ...override, operational_status: id })}
              className={cn(
                'truncate rounded-lg px-1 py-1.5 text-[11px] font-medium transition-colors',
                status === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
              title={statusLabel(id, lang)}
            >
              {t.short[id] ?? statusLabel(id, lang)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
