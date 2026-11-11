'use client';

import { Building2, Flag, Landmark, Rocket, Smartphone, Users } from 'lucide-react';
import type { Copy } from '@/lib/i18n/config';
import { useCopy } from '@/components/i18n-provider';

const SITE_URL = 'careflow-er-sync.netlify.app';

type Phase = { tag: string; title: string; points: string[] };

const COPY: Copy<{
  eyebrow: string;
  title: string;
  intro: string;
  phases: Phase[];
  whoTitle: string;
  who: { title: string; text: string }[];
  note: string;
  qrTitle: string;
  qrText: string;
  qrAlt: string;
}> = {
  en: {
    eyebrow: 'Our vision',
    title: 'From a Jeddah demo to a national care-navigation layer',
    intro: 'CareFlow is built to plug into the systems patients in Saudi Arabia already use, step by step.',
    phases: [
      {
        tag: 'Now',
        title: 'Working MVP',
        points: ['Safety-first assessment in Arabic and English', 'AI-assisted symptom understanding', 'Live re-ranking from hospital dashboards', 'Synthetic Jeddah data'],
      },
      {
        tag: 'Next',
        title: 'Clinical pilot',
        points: ['Safety rules reviewed with emergency physicians', '1-2 partner facilities sharing real waiting times', 'Usability sessions with patients and staff'],
      },
      {
        tag: 'Then',
        title: 'Integration',
        points: ['Entry point inside the Sehhaty app', 'Hand-off to the 937 health line for non-urgent advice', 'Location sharing with Red Crescent 997 in emergencies'],
      },
      {
        tag: 'Scale',
        title: 'More cities',
        points: ['Live traffic-based travel times', 'Capacity feeds from hospital systems', 'Expansion beyond Jeddah'],
      },
    ],
    whoTitle: 'Who benefits',
    who: [
      { title: 'Patients', text: 'Reach suitable care sooner, with clear reasons and safety-first guidance.' },
      { title: 'Hospitals', text: 'Smoother emergency department load and advance notice of arriving patients.' },
      { title: 'Health system', text: 'Better use of existing capacity across primary care and hospitals.' },
    ],
    note: 'Integrations are future goals and depend on the necessary approvals and partnerships.',
    qrTitle: 'Try it on your phone',
    qrText: 'Scan to open CareFlow and run an assessment yourself.',
    qrAlt: 'QR code that opens the CareFlow website',
  },
  ar: {
    eyebrow: 'رؤيتنا',
    title: 'من نموذج تجريبي في جدة إلى منصة وطنية لتوجيه الرعاية',
    intro: 'صُمم CareFlow ليتكامل خطوة بخطوة مع الأنظمة التي يستخدمها المرضى في المملكة اليوم.',
    phases: [
      {
        tag: 'الآن',
        title: 'نموذج أولي يعمل',
        points: ['تقييم يضع السلامة أولا بالعربي والإنجليزي', 'فهم الأعراض بمساعدة الذكاء الاصطناعي', 'إعادة ترتيب مباشرة من لوحات المستشفيات', 'بيانات تجريبية لمدينة جدة'],
      },
      {
        tag: 'التالي',
        title: 'تجربة سريرية',
        points: ['مراجعة قواعد السلامة مع أطباء طوارئ', 'منشأة أو منشأتان شريكتان تشاركان أوقات انتظار حقيقية', 'جلسات تجربة مع مرضى وموظفين'],
      },
      {
        tag: 'بعدها',
        title: 'التكامل',
        points: ['نقطة دخول داخل تطبيق صحتي', 'تحويل إلى خط 937 للاستشارات غير الطارئة', 'مشاركة الموقع مع الهلال الأحمر 997 في الطوارئ'],
      },
      {
        tag: 'التوسع',
        title: 'مدن أكثر',
        points: ['أوقات وصول مبنية على حركة المرور المباشرة', 'ربط السعة مع أنظمة المستشفيات', 'التوسع خارج جدة'],
      },
    ],
    whoTitle: 'من يستفيد',
    who: [
      { title: 'المرضى', text: 'وصول أسرع للرعاية المناسبة مع أسباب واضحة وإرشادات تضع السلامة أولا.' },
      { title: 'المستشفيات', text: 'ضغط أخف على أقسام الطوارئ وإشعار مسبق بالمرضى القادمين.' },
      { title: 'المنظومة الصحية', text: 'استخدام أفضل للسعة الموجودة بين الرعاية الأولية والمستشفيات.' },
    ],
    note: 'التكاملات أهداف مستقبلية وتعتمد على الحصول على الموافقات والشراكات اللازمة.',
    qrTitle: 'جربه على جوالك',
    qrText: 'امسح الرمز لفتح CareFlow وتجربة التقييم بنفسك.',
    qrAlt: 'رمز QR يفتح موقع CareFlow',
  },
};

const PHASE_ICONS = [Flag, Users, Landmark, Rocket];
const WHO_ICONS = [Users, Building2, Landmark];

export function VisionSection() {
  const t = useCopy(COPY);
  return (
    <section id="vision" className="scroll-mt-20 border-t border-border bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">{t.eyebrow}</p>
        <h2 className="mt-2 max-w-3xl font-display text-3xl font-bold text-slate-900 sm:text-4xl">{t.title}</h2>
        <p className="mt-3 max-w-2xl text-slate-600">{t.intro}</p>

        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {t.phases.map((p, i) => {
            const Icon = PHASE_ICONS[i];
            return (
              <li key={p.title} className={`rounded-2xl border p-5 ${i === 0 ? 'border-teal-300 bg-teal-50' : 'border-border bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${i === 0 ? 'bg-primary' : 'bg-navy-900'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {i + 1}. {p.tag}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-slate-900">{p.title}</h3>
                <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-slate-600">
                  {p.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-slate-500">{t.note}</p>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{t.whoTitle}</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {t.who.map((w, i) => {
                const Icon = WHO_ICONS[i];
                return (
                  <div key={w.title} className="rounded-2xl border border-border p-5">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="mt-2 font-semibold text-slate-900">{w.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{w.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col items-center rounded-3xl bg-navy-900 p-6 text-center text-white">
            <p className="flex items-center gap-2 font-semibold">
              <Smartphone className="h-5 w-5 text-teal-300" /> {t.qrTitle}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/careflow-qr.svg" alt={t.qrAlt} width={176} height={176} className="mt-4 h-44 w-44 rounded-xl bg-white p-2" />
            <p className="mt-4 text-sm text-slate-300">{t.qrText}</p>
            <p dir="ltr" className="mt-1 font-mono text-xs text-teal-300">
              {SITE_URL}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
