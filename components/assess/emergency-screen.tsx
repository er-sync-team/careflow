'use client';

import { HeartHandshake, Phone, RotateCcw, Siren } from 'lucide-react';
import type { Copy } from '@/lib/i18n/config';
import { phrase } from '@/lib/i18n/terms';
import { useLang } from '@/components/i18n-provider';
import { ShareLocation } from './share-location';

const COPY: Copy<{
  eyebrow: string;
  title: string;
  body: string;
  call: string;
  why: string;
  rules: string;
  wait: string;
  steps: string[];
  disclaimer: string;
  restart: string;
}> = {
  en: {
    eyebrow: 'Emergency warning',
    title: 'Call 997 for an ambulance now',
    body: 'What you reported may be a sign of a life-threatening condition. Contact emergency services immediately. Do not wait for a facility recommendation and do not drive yourself.',
    call: 'Call 997',
    why: 'Why you are seeing this',
    rules: 'These warning signs are detected by fixed safety rules. Facility ranking is intentionally not shown for possible emergencies.',
    wait: 'While you wait for help',
    steps: [
      'Stay with the patient and keep them as calm and still as possible.',
      'Unlock the door and keep your phone nearby so responders can reach you.',
      'Do not give food or drink unless instructed by emergency services.',
      'If the person stops breathing, follow the dispatcher\u2019s CPR instructions.',
    ],
    disclaimer: 'CareFlow does not provide medical diagnoses. This is a demonstration prototype.',
    restart: 'Start a new assessment',
  },
  ar: {
    eyebrow: 'تحذير طارئ',
    title: 'اتصل بالرقم 997 لطلب الإسعاف الآن',
    body: 'ما أبلغت عنه قد يكون علامة على حالة تهدد الحياة. تواصل مع خدمات الطوارئ فورا. لا تنتظر توصية بمنشأة ولا تقد السيارة بنفسك.',
    call: 'اتصل بـ 997',
    why: 'لماذا تظهر لك هذه الرسالة',
    rules: 'يتم اكتشاف هذه العلامات التحذيرية بواسطة قواعد سلامة ثابتة. لا يتم عرض ترتيب المنشآت عمدا في حالات الطوارئ المحتملة.',
    wait: 'أثناء انتظار المساعدة',
    steps: [
      'ابق مع المريض وحافظ على هدوئه وثباته قدر الإمكان.',
      'افتح باب المنزل وأبق هاتفك قريبا ليتمكن المسعفون من الوصول إليك.',
      'لا تقدم أي طعام أو شراب إلا بتوجيه من خدمات الطوارئ.',
      'إذا توقف الشخص عن التنفس، فاتبع تعليمات الإنعاش القلبي الرئوي من موظف الطوارئ.',
    ],
    disclaimer: 'لا يقدم CareFlow تشخيصا طبيا. هذا نموذج أولي للعرض التجريبي.',
    restart: 'ابدأ تقييما جديدا',
  },
};

export function EmergencyScreen({ flags, onRestart }: { flags: string[]; onRestart: () => void }) {
  const { lang } = useLang();
  const t = COPY[lang];
  return (
    <div role="alert" className="animate-fade-up overflow-hidden rounded-3xl border-2 border-red-600 bg-white shadow-2xl shadow-red-900/10">
      <div className="bg-red-700 px-6 py-8 text-white sm:px-10">
        <div className="flex items-center gap-3">
          <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/20" />
            <Siren className="h-6 w-6" />
          </span>
          <p className="text-sm font-semibold uppercase tracking-wider text-red-100">{t.eyebrow}</p>
        </div>
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{t.title}</h2>
        <p className="mt-3 max-w-2xl text-red-50">
          {t.body}
        </p>
        <a
          href="tel:997"
          className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 font-display text-xl font-bold text-red-700 shadow-lg transition-transform hover:scale-[1.02]"
        >
          <Phone className="h-6 w-6" /> {t.call}
        </a>
      </div>
      <div className="px-6 pt-8 sm:px-10">
        <ShareLocation />
      </div>
      <div className="grid gap-8 px-6 py-8 sm:px-10 md:grid-cols-2">
        <div>
          <h3 className="font-semibold text-slate-900">{t.why}</h3>
          <ul className="mt-3 space-y-2">
            {flags.map((f) => (
              <li key={f} className="flex gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
                {phrase(f, lang)}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            {t.rules}
          </p>
        </div>
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <HeartHandshake className="h-4 w-4 text-red-600" /> {t.wait}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {t.steps.map((step) => (
              <li key={step} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-col items-start justify-between gap-3 border-t border-border bg-slate-50 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-10">
        <span>{t.disclaimer}</span>
        <button onClick={onRestart} className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-slate-900">
          <RotateCcw className="h-3.5 w-3.5" /> {t.restart}
        </button>
      </div>
    </div>
  );
}
