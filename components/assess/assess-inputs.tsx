'use client';

import { useState } from 'react';
import { Loader2, LocateFixed, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { HISTORY_OPTIONS, SYMPTOMS } from '@/lib/triage/catalog';
import { DEMO_LOCATIONS } from '@/lib/geo';
import type { LatLng } from '@/lib/types';
import type { Copy } from '@/lib/i18n/config';
import { historyLabel, locationLabel, symptomLabel } from '@/lib/i18n/terms';
import { useCopy, useLang } from '@/components/i18n-provider';
import { Chip } from './chat-ui';

const COPY: Copy<{
  agePlaceholder: string;
  continue: string;
  common: string;
  warning: string;
  describe: string;
  understanding: string;
  none: string;
  noGeo: string;
  geoFailed: string;
  myLocation: string;
  useLocation: string;
  orPick: string;
}> = {
  en: {
    agePlaceholder: 'Age in years (0 for babies under 1)',
    continue: 'Continue',
    common: 'Common symptoms',
    warning: 'Urgent warning signs',
    describe: "Or describe it in your own words, e.g. 'I twisted my ankle and it is swollen'",
    understanding: 'Understanding your symptoms',
    none: 'None of these',
    noGeo: 'Location is not available on this device. Please choose a district.',
    geoFailed: 'We could not get your location. Please choose a district instead.',
    myLocation: 'My current location',
    useLocation: 'Use my current location',
    orPick: 'or pick a Jeddah district for the demo',
  },
  ar: {
    agePlaceholder: 'العمر بالسنوات (0 للرضع دون السنة)',
    continue: 'متابعة',
    common: 'أعراض شائعة',
    warning: 'علامات تحذيرية عاجلة',
    describe: 'أو صف ما تشعر به بكلماتك، مثال: "التوى كاحلي وهو متورم"',
    understanding: 'جار فهم الأعراض',
    none: 'لا شيء مما سبق',
    noGeo: 'خدمة الموقع غير متاحة على هذا الجهاز. يرجى اختيار حي.',
    geoFailed: 'تعذر تحديد موقعك. يرجى اختيار حي بدلا من ذلك.',
    myLocation: 'موقعي الحالي',
    useLocation: 'استخدم موقعي الحالي',
    orPick: 'أو اختر حيا في جدة للعرض التجريبي',
  },
};

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50';

export function AgeInput({ onSubmit }: { onSubmit: (age: number) => void }) {
  const t = useCopy(COPY);
  const [value, setValue] = useState('');
  const n = Number(value);
  const valid = value.trim() !== '' && Number.isInteger(n) && n >= 0 && n <= 120;
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(n);
      }}
    >
      <input
        autoFocus
        inputMode="numeric"
        type="number"
        min={0}
        max={120}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t.agePlaceholder}
        className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-100"
      />
      <button type="submit" disabled={!valid} className={primaryBtn}>
        {t.continue}
      </button>
    </form>
  );
}

export function SymptomPicker({ onSubmit }: { onSubmit: (ids: string[], description: string) => Promise<void> }) {
  const t = useCopy(COPY);
  const { lang } = useLang();
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const warning = SYMPTOMS.filter((s) => s.immediateFlag);
  const common = SYMPTOMS.filter((s) => !s.immediateFlag);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.common}</p>
        <div className="flex flex-wrap gap-2">
          {common.map((s) => (
            <Chip key={s.id} selected={selected.includes(s.id)} onClick={() => toggle(s.id)}>
              {symptomLabel(s.id, lang)}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">{t.warning}</p>
        <div className="flex flex-wrap gap-2">
          {warning.map((s) => (
            <Chip key={s.id} danger selected={selected.includes(s.id)} onClick={() => toggle(s.id)}>
              {symptomLabel(s.id, lang)}
            </Chip>
          ))}
        </div>
      </div>
      <textarea
        value={text}
        maxLength={1000}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder={t.describe}
        className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-100"
      />
      <div className="flex justify-end">
        <button
          disabled={busy || (selected.length === 0 && !text.trim())}
          className={primaryBtn}
          onClick={async () => {
            setBusy(true);
            await onSubmit(selected, text.trim());
            setBusy(false);
          }}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? t.understanding : t.continue}
        </button>
      </div>
    </div>
  );
}

export function HistoryPicker({ hidePregnancy, onSubmit }: { hidePregnancy: boolean; onSubmit: (ids: string[]) => void }) {
  const t = useCopy(COPY);
  const { lang } = useLang();
  const [selected, setSelected] = useState<string[]>([]);
  const options = HISTORY_OPTIONS.filter((h) => !(hidePregnancy && h.id === 'pregnancy'));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {options.map((h) => (
          <Chip
            key={h.id}
            selected={selected.includes(h.id)}
            onClick={() => setSelected((s) => (s.includes(h.id) ? s.filter((x) => x !== h.id) : [...s, h.id]))}
          >
            {historyLabel(h.id, lang)}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={() => onSubmit([])}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {t.none}
        </button>
        <button disabled={selected.length === 0} onClick={() => onSubmit(selected)} className={primaryBtn}>
          {t.continue}
        </button>
      </div>
    </div>
  );
}

export function LocationPicker({ onSubmit }: { onSubmit: (coords: LatLng, label: string) => void }) {
  const t = useCopy(COPY);
  const { lang } = useLang();
  const [locating, setLocating] = useState(false);
  const locate = () => {
    if (!('geolocation' in navigator)) {
      toast.error(t.noGeo);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onSubmit({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'My current location');
      },
      () => {
        setLocating(false);
        toast.error(t.geoFailed);
      },
      { timeout: 10000 },
    );
  };
  return (
    <div className="space-y-3">
      <button onClick={locate} disabled={locating} className={`${primaryBtn} w-full`}>
        {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        {t.useLocation}
      </button>
      <p className="text-center text-xs text-slate-500">{t.orPick}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {DEMO_LOCATIONS.map((l) => (
          <button
            key={l.id}
            onClick={() => onSubmit(l.coords, locationLabel(l.id, lang))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-start text-sm font-medium text-slate-700 transition-colors hover:border-primary hover:text-primary"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {locationLabel(l.id, lang)}
          </button>
        ))}
      </div>
    </div>
  );
}
