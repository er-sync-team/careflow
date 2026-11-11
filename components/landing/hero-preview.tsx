import { Clock, MapPin, Sparkles } from 'lucide-react';
import type { Copy, Lang } from '@/lib/i18n/config';

const COPY: Copy<{
  options: { name: string; score: number; eta: number; wait: number; tag: string }[];
  result: string;
  pathway: string;
  priority: string;
  min: string;
  wait: string;
  footnote: string;
}> = {
  en: {
    options: [
      { name: 'Obhur Heights General', score: 86, eta: 14, wait: 15, tag: 'Cardiology' },
      { name: 'Corniche Coastal Medical', score: 78, eta: 9, wait: 35, tag: 'Cardiology' },
      { name: 'Rawdah Unity Hospital', score: 61, eta: 6, wait: 70, tag: 'Internal Medicine' },
    ],
    result: 'Preliminary result',
    pathway: 'Emergency Department',
    priority: 'High Priority',
    min: 'min',
    wait: 'min wait',
    footnote: 'Illustrative preview with synthetic data',
  },
  ar: {
    options: [
      { name: 'مستشفى مرتفعات أبحر العام', score: 86, eta: 14, wait: 15, tag: 'أمراض القلب' },
      { name: 'مركز الكورنيش الساحلي الطبي', score: 78, eta: 9, wait: 35, tag: 'أمراض القلب' },
      { name: 'مستشفى الروضة الموحد', score: 61, eta: 6, wait: 70, tag: 'الباطنية' },
    ],
    result: 'النتيجة الأولية',
    pathway: 'قسم الطوارئ',
    priority: 'أولوية عالية',
    min: 'دقيقة',
    wait: 'دقيقة انتظار',
    footnote: 'معاينة توضيحية ببيانات تجريبية',
  },
};

export function HeroPreview({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-teal-400/30 via-sky-400/10 to-teal-300/20 opacity-80 blur-xl" />
      <div className="relative rounded-3xl border border-border bg-white p-6 shadow-2xl shadow-teal-900/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{t.result}</p>
            <p className="mt-1 font-display text-lg font-bold text-slate-900">{t.pathway}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800 ring-1 ring-orange-200">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> {t.priority}
          </span>
        </div>
        <div className="mt-6 space-y-3">
          {t.options.map((o, i) => (
            <div
              key={o.name}
              className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${i === 0 ? 'border-teal-300 bg-teal-50/60' : 'border-border'}`}
              style={{ animation: `fade-up 0.6s ease-out ${i * 0.15}s both` }}
            >
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white ring-4 ring-teal-100">
                <span className="font-display text-sm font-bold text-teal-800">{o.score}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{o.name}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{o.eta} {t.min}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{o.wait} {t.wait}</span>
                  <span>{o.tag}</span>
                </div>
              </div>
              {i === 0 && <Sparkles className="h-4 w-4 text-teal-600" />}
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">{t.footnote}</p>
      </div>
    </div>
  );
}
