'use client';

import { useEffect, useState } from 'react';
import { Check, History, Loader2, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Hospital, OperationalStatus } from '@/lib/types';
import { SPECIALTY_LABELS } from '@/lib/triage/catalog';
import type { Copy } from '@/lib/i18n/config';
import { specialtyLabel, statusLabel } from '@/lib/i18n/terms';
import { useLang } from '@/components/i18n-provider';
import { cn } from '@/lib/utils';
import { DEMO_BASELINE } from '@/lib/demo-baseline';
import { CapacityBar, STATUS_OPTIONS } from '@/components/shared/badges';

type Editable = Pick<
  Hospital,
  'wait_minutes' | 'treatment_minutes' | 'total_capacity' | 'current_occupancy' | 'available_doctors' | 'specialties' | 'operational_status'
>;

type NumericKey = Exclude<keyof Editable, 'specialties' | 'operational_status'>;

const NUMERIC: { key: NumericKey; min: number; max: number; unit?: boolean }[] = [
  { key: 'wait_minutes', min: 0, max: 1440, unit: true },
  { key: 'treatment_minutes', min: 0, max: 1440, unit: true },
  { key: 'available_doctors', min: 0, max: 500 },
  { key: 'total_capacity', min: 1, max: 2000 },
  { key: 'current_occupancy', min: 0, max: 4000 },
];

const COPY: Copy<{
  fields: Record<NumericKey, string>;
  min: string;
  saveFailed: string;
  saved: string;
  status: string;
  statusHint: string;
  capacity: string;
  range: (min: number, max: number) => string;
  specialties: string;
  preview: string;
  totalTime: (wait: string) => [string, string, string];
  ownOnly: string;
  save: string;
  discard: string;
  reset: string;
  resetHint: string;
  resetDone: string;
}> = {
  en: {
    fields: {
      wait_minutes: 'Estimated waiting time',
      treatment_minutes: 'Estimated treatment time',
      available_doctors: 'Available doctors',
      total_capacity: 'Total capacity (beds)',
      current_occupancy: 'Current occupancy',
    },
    min: 'min',
    saveFailed: 'Could not save facility settings. Please check the values and try again.',
    saved: 'Facility updated. Patient recommendations re-rank instantly.',
    status: 'Operational status',
    statusHint: 'Closed or diverting facilities are excluded from emergency department recommendations.',
    capacity: 'Capacity and staffing',
    range: (min, max) => `Enter a whole number between ${min} and ${max}.`,
    specialties: 'Available specialties',
    preview: 'Preview',
    totalTime: (wait) => ['Total time shown to patients: travel + ', `${wait} min`, ' wait.'],
    ownOnly: 'You can only edit your own facility. Changes are visible to patients immediately.',
    save: 'Save changes',
    discard: 'Discard changes',
    reset: 'Reset demo data',
    resetHint: 'Restores this facility to its original demo values so the next person sees the expected results.',
    resetDone: 'Demo data restored. Recommendations re-rank instantly.',
  },
  ar: {
    fields: {
      wait_minutes: 'وقت الانتظار المتوقع',
      treatment_minutes: 'وقت العلاج المتوقع',
      available_doctors: 'الأطباء المتاحون',
      total_capacity: 'السعة الإجمالية (أسرة)',
      current_occupancy: 'الإشغال الحالي',
    },
    min: 'دقيقة',
    saveFailed: 'تعذر حفظ إعدادات المنشأة. يرجى التحقق من القيم والمحاولة مرة أخرى.',
    saved: 'تم تحديث المنشأة. يعاد ترتيب توصيات المرضى فورا.',
    status: 'الحالة التشغيلية',
    statusHint: 'تستبعد المنشآت المغلقة أو التي تحول المرضى من توصيات أقسام الطوارئ.',
    capacity: 'السعة والكادر',
    range: (min, max) => `أدخل عددا صحيحا بين ${min} و${max}.`,
    specialties: 'التخصصات المتاحة',
    preview: 'معاينة',
    totalTime: (wait) => ['إجمالي الوقت المعروض للمرضى: وقت الوصول + ', `${wait} دقيقة`, ' انتظار.'],
    ownOnly: 'يمكنك تعديل منشأتك فقط. تظهر التغييرات للمرضى فورا.',
    save: 'حفظ التغييرات',
    discard: 'تجاهل التغييرات',
    reset: 'إعادة ضبط بيانات العرض',
    resetHint: 'يعيد هذه المنشأة إلى قيم العرض الأصلية حتى يرى الشخص التالي النتائج المتوقعة.',
    resetDone: 'تمت استعادة بيانات العرض. يعاد ترتيب التوصيات فورا.',
  },
};

const pick = (h: Hospital): Editable => ({
  wait_minutes: h.wait_minutes,
  treatment_minutes: h.treatment_minutes,
  total_capacity: h.total_capacity,
  current_occupancy: h.current_occupancy,
  available_doctors: h.available_doctors,
  specialties: h.specialties,
  operational_status: h.operational_status,
});

export function FacilityEditor({ hospital, onSaved }: { hospital: Hospital; onSaved: (h: Hospital) => void }) {
  const { lang } = useLang();
  const t = COPY[lang];
  const [form, setForm] = useState<Editable>(() => pick(hospital));
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(pick(hospital)), [hospital]);

  const errors = NUMERIC.filter(({ key, min, max }) => !Number.isInteger(form[key]) || form[key] < min || form[key] > max).map((n) => n.key);
  const dirty = JSON.stringify(form) !== JSON.stringify(pick(hospital));

  const toggleSpecialty = (s: string) =>
    setForm((f) => ({ ...f, specialties: f.specialties.includes(s) ? f.specialties.filter((x) => x !== s) : [...f.specialties, s] }));

  const persist = async (values: Editable, successMessage: string) => {
    setSaving(true);
    const { data, error } = await supabase.from('hospitals').update(values).eq('id', hospital.id).select().maybeSingle();
    setSaving(false);
    if (error || !data) {
      toast.error(t.saveFailed);
      return;
    }
    onSaved(data as Hospital);
    toast.success(successMessage);
  };

  const save = async () => {
    if (errors.length) return;
    await persist(form, t.saved);
  };

  const baseline = DEMO_BASELINE[hospital.id];
  const atBaseline = !baseline || JSON.stringify(pick({ ...hospital, ...baseline })) === JSON.stringify(pick(hospital));
  const resetDemo = async () => {
    if (!baseline) return;
    await persist(baseline, t.resetDone);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6 rounded-2xl border border-border bg-white p-6">
        <section>
          <h3 className="font-display text-lg font-bold text-slate-900">{t.status}</h3>
          <p className="text-sm text-slate-500">{t.statusHint}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUS_OPTIONS.map((id: OperationalStatus) => (
              <button
                key={id}
                onClick={() => setForm((f) => ({ ...f, operational_status: id }))}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-sm font-medium transition-all',
                  form.operational_status === id ? 'border-primary bg-accent text-accent-foreground ring-2 ring-primary/20' : 'border-border text-slate-700 hover:border-slate-400',
                )}
              >
                {statusLabel(id, lang)}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-display text-lg font-bold text-slate-900">{t.capacity}</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {NUMERIC.map(({ key, min, max, unit }) => (
              <label key={key} className="block">
                <span className="text-sm font-medium text-slate-700">{t.fields[key]}</span>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={Number.isNaN(form[key]) ? '' : form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value === '' ? NaN : Math.round(Number(e.target.value)) }))}
                    className={cn(
                      'w-full rounded-xl border bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:ring-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                      unit && 'pe-14',
                      errors.includes(key) ? 'border-red-400 focus:ring-red-100' : 'border-slate-300 focus:border-primary focus:ring-teal-100',
                    )}
                  />
                  {unit && <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{t.min}</span>}
                </div>
                {errors.includes(key) && (
                  <span className="mt-1 block text-xs text-red-600">
                    {t.range(min, max)}
                  </span>
                )}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-display text-lg font-bold text-slate-900">{t.specialties}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.keys(SPECIALTY_LABELS).map((id) => {
              const on = form.specialties.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleSpecialty(id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
                    on ? 'border-primary bg-primary text-white' : 'border-border text-slate-700 hover:border-slate-400',
                  )}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                  {specialtyLabel(id, lang)}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-border bg-white p-6 lg:sticky lg:top-24">
        <p className="font-display font-bold text-slate-900">{t.preview}</p>
        {!errors.includes('total_capacity') && !errors.includes('current_occupancy') && (
          <CapacityBar occupancy={form.current_occupancy} capacity={form.total_capacity} />
        )}
        <p className="text-sm text-slate-600">
          {(() => {
            const [before, wait, after] = t.totalTime(Number.isNaN(form.wait_minutes) ? '-' : String(form.wait_minutes));
            return (
              <>
                {before}
                <strong>{wait}</strong>
                {after}
              </>
            );
          })()}
        </p>
        <p className="text-xs text-slate-500">{t.ownOnly}</p>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={!dirty || saving || errors.length > 0}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t.save}
          </button>
          <button
            onClick={() => setForm(pick(hospital))}
            disabled={!dirty || saving}
            aria-label={t.discard}
            className="rounded-xl border border-slate-300 px-3 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        {baseline && (
          <div className="border-t border-border pt-4">
            <button
              onClick={resetDemo}
              disabled={saving || atBaseline}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-50"
            >
              <History className="h-4 w-4" />
              {t.reset}
            </button>
            <p className="mt-2 text-xs text-slate-500">{t.resetHint}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
