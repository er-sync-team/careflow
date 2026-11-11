import Link from 'next/link';
import { ArrowRight, Building2, HeartPulse, MousePointerClick, RefreshCw, Stethoscope } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { LiveRankingDemo } from '@/components/demo/live-ranking-demo';
import { DemoCredentials } from '@/components/demo/demo-credentials';
import { DEMO_ADMIN_PASSWORD, DEMO_SCENARIOS, demoAdminEmail, scenarioText } from '@/lib/demo-scenarios';
import { getLang } from '@/lib/i18n/server';
import type { Copy } from '@/lib/i18n/config';

export const metadata = { title: 'Demo Mode | CareFlow' };

const COPY: Copy<{
  eyebrow: string;
  title: string;
  intro: string;
  aTitle: string;
  aPoints: string[];
  aRun: string;
  bTitle: string;
  bSteps: string[];
  bRun: string;
  dynamic: string;
  liveTitle: string;
  liveText: string;
  tryIt: string;
  try1: [string, string];
  try2: string;
  try3: string;
  try4: string;
  dashboards: string;
}> = {
  en: {
    eyebrow: 'Demo Mode',
    title: 'See CareFlow work from first symptom to hospital dashboard',
    intro: 'Every patient, facility and account here is synthetic. Rankings are computed live from the database; nothing on this page is pre-recorded.',
    aTitle: 'Severe chest pain, 20 minutes ago',
    aPoints: [
      'The warning sign is detected by fixed safety rules',
      'Emergency instructions appear immediately',
      'A one-tap option to call 997 for an ambulance',
      'No routine hospital comparison delays the action',
    ],
    aRun: 'Run Scenario A',
    bTitle: 'A stable patient, matched end to end',
    bSteps: [
      'Answer the guided assessment (use the suggested demo answers)',
      'Initial screening runs; no warning signs are found',
      'The Primary Care pathway is shown with its reasons',
      'Eligible facilities are compared on cards and a map',
      'Select a facility; an incoming case is created',
      'Open that facility dashboard and see the new case',
      'Change waiting time or capacity in Facility settings',
      'Return to the patient screen and watch the ranking update',
    ],
    bRun: 'Run Scenario B',
    dynamic: 'Dynamic re-ranking',
    liveTitle: 'Hospital A, B and C, live from the database',
    liveText:
      "Hospital A is 5 km away with a 45 minute wait, Hospital B is 9 km with 15 minutes, Hospital C is 7 km with 75 minutes. Change Hospital B's waiting time to 100 minutes from its dashboard and this table re-ranks automatically.",
    tryIt: 'Try it',
    try1: ["Open Hospital B's dashboard", 'in a new tab'],
    try2: 'Sign in as',
    try3: 'Facility settings: set waiting time to 100 and save',
    try4: 'Come back here; set it back to 15 to reset',
    dashboards: 'Hospital dashboards',
  },
  ar: {
    eyebrow: 'وضع العرض',
    title: 'شاهد كيرفلو يعمل من أول عرض إلى لوحة المستشفى',
    intro: 'جميع المرضى والمنشآت والحسابات هنا تجريبية. يتم حساب الترتيب مباشرة من قاعدة البيانات، ولا شيء في هذه الصفحة مسجل مسبقا.',
    aTitle: 'ألم شديد في الصدر منذ 20 دقيقة',
    aPoints: [
      'تكتشف قواعد السلامة الثابتة العلامة التحذيرية',
      'تظهر تعليمات الطوارئ فورا',
      'خيار بلمسة واحدة للاتصال بـ 997 وطلب الإسعاف',
      'لا توجد مقارنة بين المستشفيات تؤخر التصرف',
    ],
    aRun: 'شغّل السيناريو أ',
    bTitle: 'مريضة مستقرة، مطابقة من البداية للنهاية',
    bSteps: [
      'أجب عن التقييم الموجه (استخدم الإجابات التجريبية المقترحة)',
      'يتم الفحص الأولي ولا توجد علامات تحذيرية',
      'يظهر مسار الرعاية الأولية مع أسبابه',
      'تقارن المنشآت المؤهلة عبر البطاقات والخريطة',
      'اختر منشأة فيتم إنشاء حالة قادمة',
      'افتح لوحة تلك المنشأة وشاهد الحالة الجديدة',
      'غيّر وقت الانتظار أو السعة من إعدادات المنشأة',
      'عد إلى شاشة المريض وشاهد تحديث الترتيب',
    ],
    bRun: 'شغّل السيناريو ب',
    dynamic: 'إعادة الترتيب الديناميكي',
    liveTitle: 'المستشفيات أ وب وج، مباشرة من قاعدة البيانات',
    liveText:
      'المستشفى أ يبعد 5 كم بوقت انتظار 45 دقيقة، والمستشفى ب يبعد 9 كم بانتظار 15 دقيقة، والمستشفى ج يبعد 7 كم بانتظار 75 دقيقة. غيّر وقت انتظار المستشفى ب إلى 100 دقيقة من لوحته وسيعاد ترتيب هذا الجدول تلقائيا.',
    tryIt: 'جرّبها',
    try1: ['افتح لوحة المستشفى ب', 'في علامة تبويب جديدة'],
    try2: 'سجّل الدخول باستخدام',
    try3: 'إعدادات المنشأة: اجعل وقت الانتظار 100 واحفظ',
    try4: 'عد إلى هنا، ثم أرجعه إلى 15 لإعادة الضبط',
    dashboards: 'لوحات المستشفيات',
  },
};

const arrow = 'h-4 w-4 transition-transform rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1';

export default function DemoPage() {
  const lang = getLang();
  const t = COPY[lang];
  const a = scenarioText(DEMO_SCENARIOS.emergency, lang);
  const b = scenarioText(DEMO_SCENARIOS.matching, lang);
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 text-white">
          <div className="absolute -end-24 -top-24 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-300">{t.eyebrow}</p>
            <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold sm:text-5xl">{t.title}</h1>
            <p className="mt-4 max-w-2xl text-slate-300">{t.intro}</p>
          </div>
        </section>

        <section className="mx-auto -mt-8 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
          <article className="relative flex flex-col rounded-3xl border border-red-200 bg-white p-7 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white">
              <HeartPulse className="h-6 w-6" />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-red-700">{a.title}</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{t.aTitle}</h2>
            <p className="mt-2 text-slate-600">{a.summary}</p>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm text-slate-700">
              {t.aPoints.map((p) => (
                <li key={p}>- {p}</li>
              ))}
            </ul>
            <Link
              href="/assess?demo=emergency"
              className="group mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-red-700"
            >
              {t.aRun} <ArrowRight className={arrow} />
            </Link>
          </article>

          <article className="relative flex flex-col rounded-3xl border border-teal-200 bg-white p-7 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Stethoscope className="h-6 w-6" />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-teal-700">{b.title}</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{t.bTitle}</h2>
            <p className="mt-2 text-slate-600">{b.summary}</p>
            <ol className="mt-4 grid flex-1 gap-1.5 text-sm text-slate-700 sm:grid-cols-2">
              {t.bSteps.map((s, i) => (
                <li key={s} className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-800">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
            <Link
              href="/assess?demo=matching"
              className="group mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-teal-800"
            >
              {t.bRun} <ArrowRight className={arrow} />
            </Link>
          </article>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                <RefreshCw className="h-3.5 w-3.5" /> {t.dynamic}
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-slate-900">{t.liveTitle}</h2>
              <p className="mt-2 max-w-2xl text-slate-600">{t.liveText}</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-950">
              <p className="flex items-center gap-2 font-semibold">
                <MousePointerClick className="h-4 w-4" /> {t.tryIt}
              </p>
              <ol className="mt-2 list-decimal space-y-1 ps-5">
                <li>
                  <a href="/admin?facility=H06" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
                    {t.try1[0]}
                  </a>{' '}
                  {t.try1[1]}
                </li>
                <li>
                  {t.try2}{' '}
                  <span dir="ltr" className="inline-block">
                    <span className="break-all font-mono text-xs">{demoAdminEmail('H06')}</span> / <span className="font-mono text-xs">{DEMO_ADMIN_PASSWORD}</span>
                  </span>
                </li>
                <li>{t.try3}</li>
                <li>{t.try4}</li>
              </ol>
            </div>
          </div>
          <div className="mt-8">
            <LiveRankingDemo />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-bold text-slate-900">{t.dashboards}</h2>
          </div>
          <DemoCredentials />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
