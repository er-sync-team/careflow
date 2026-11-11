import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Building2,
  ClipboardCheck,
  Gauge,
  HeartPulse,
  MapPinned,
  MessageSquareHeart,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Stethoscope,
} from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { HeroPreview } from '@/components/landing/hero-preview';
import { VisionSection } from '@/components/landing/vision-section';
import { WEIGHT_PROFILES, type MatchWeights } from '@/lib/matching';
import { factorLabel } from '@/lib/i18n/terms';
import { getLang } from '@/lib/i18n/server';
import type { Copy } from '@/lib/i18n/config';

const STEP_ICONS = [MessageSquareHeart, ShieldAlert, Stethoscope, Gauge, MapPinned];

const PATHWAY_STYLE = [
  { icon: Siren, tone: 'border-red-200 bg-red-50/60', iconTone: 'bg-red-600 text-white' },
  { icon: Activity, tone: 'border-orange-200 bg-orange-50/60', iconTone: 'bg-orange-500 text-white' },
  { icon: Stethoscope, tone: 'border-emerald-200 bg-emerald-50/60', iconTone: 'bg-emerald-600 text-white' },
];

const DEMO_STYLE = [
  { href: '/assess?demo=emergency', icon: HeartPulse, tone: 'from-red-500/20 to-red-500/0 ring-red-400/30', iconTone: 'bg-red-500 text-white' },
  { href: '/assess?demo=matching', icon: Stethoscope, tone: 'from-teal-400/20 to-teal-400/0 ring-teal-300/30', iconTone: 'bg-teal-500 text-white' },
  { href: '/demo', icon: RefreshCw, tone: 'from-sky-400/20 to-sky-400/0 ring-sky-300/30', iconTone: 'bg-sky-500 text-white' },
];

type Item = { title: string; text: string };

const COPY: Copy<{
  badge: string;
  heroTitle: [string, string, string];
  heroText: string;
  start: string;
  demoMode: string;
  disclaimer: string;
  demoTitle: string;
  demoGuide: string;
  demoCards: (Item & { tag: string })[];
  runIt: string;
  howEyebrow: string;
  howTitle: string;
  steps: Item[];
  pathwaysEyebrow: string;
  pathwaysTitle: string;
  pathways: Item[];
  matchEyebrow: string;
  matchTitle: string;
  matchText: string;
  matchSteps: string[];
  weightsTitle: string;
  limitedNote: string;
  teamsAlt: string;
  teamsTitle: string;
  teamsText: string;
  teamsCta: string;
}> = {
  en: {
    badge: 'Smart Emergency Routing - Jeddah demo by Team ER Sync',
    heroTitle: ['The right care.', 'The right place.', 'The right time.'],
    heroText:
      'CareFlow combines safety-first initial screening with live facility capacity and waiting times to help you find a suitable place for care.',
    start: 'Start free assessment',
    demoMode: 'Demo Mode',
    disclaimer: 'Not a diagnosis and not a replacement for emergency services. In an emergency call 997. All facility and patient data is synthetic.',
    demoTitle: 'Walk through CareFlow with synthetic patients',
    demoGuide: 'Open the full Demo Mode guide',
    demoCards: [
      {
        tag: 'Scenario A',
        title: 'Emergency warning',
        text: 'Severe chest pain that began 20 minutes ago. CareFlow stops and shows 997 instructions immediately, with no hospital comparison.',
      },
      {
        tag: 'Scenario B',
        title: 'Facility matching, end to end',
        text: 'A stable patient completes the assessment, compares facilities on cards and a map, and selects one that receives the case.',
      },
      {
        tag: 'Live re-ranking',
        title: 'Hospital A, B and C',
        text: 'An administrator changes Hospital B waiting time from 15 to 100 minutes and the ranking is recomputed from the database.',
      },
    ],
    runIt: 'Run it',
    howEyebrow: 'How it works',
    howTitle: 'An end-to-end patient journey',
    steps: [
      { title: 'Guided check-in', text: 'A friendly conversational assessment collects symptoms, severity, onset and history. No account needed.' },
      { title: 'Safety rules first', text: 'Fixed warning-sign rules run before anything else. Life-threatening signs stop the flow and show 997.' },
      { title: 'Care pathway', text: 'You get a preliminary urgency category and a suggested pathway, with the reasons spelled out.' },
      { title: 'Smart matching', text: 'Eligible facilities are ranked by a transparent weighted score using travel, waiting time and capacity.' },
      { title: 'Go with confidence', text: 'Compare options on a map, pick a facility and get directions. The hospital sees you are coming.' },
    ],
    pathwaysEyebrow: 'Care pathways',
    pathwaysTitle: 'Three clear paths, explained every time',
    pathways: [
      {
        title: 'Emergency Assistance',
        text: 'For possible life-threatening signs such as severe chest pain, stroke signs or severe breathing difficulty. Routine ranking is skipped and you are directed to call 997.',
      },
      {
        title: 'Emergency Department',
        text: 'For high priority cases that need prompt evaluation. Only facilities with an open emergency department and free capacity are considered.',
      },
      {
        title: 'Primary Care',
        text: 'For non-urgent concerns. You are matched to primary care centers and clinics, keeping emergency departments free for those who need them.',
      },
    ],
    matchEyebrow: 'Transparent matching',
    matchTitle: 'A score you can read, not a black box',
    matchText:
      'Facilities that lack a required service, are closed, diverting or full are removed first. Only then is each remaining option scored. A short wait can never outrank clinical suitability or safety rules.',
    matchSteps: [
      'Step 1: Apply warning-sign safety rules',
      'Step 2: Choose a care pathway',
      'Step 3: Exclude unsuitable facilities',
      'Step 4: Rank by weighted score',
      'Step 5: Explain every match',
      'Step 6: Re-rank instantly when hospital data changes',
    ],
    weightsTitle: 'Weights for a High Priority case',
    limitedNote: 'Facilities operating with limited services receive a 10% score reduction.',
    teamsAlt: 'A nurse reviewing notes near an emergency room sign',
    teamsTitle: 'Built for hospital teams too',
    teamsText:
      'Administrators see incoming patients, priority mix and recent assessment summaries for their facility, and update waiting time, capacity and service availability. Every change instantly reshapes patient recommendations.',
    teamsCta: 'Open hospital dashboard',
  },
  ar: {
    badge: 'التوجيه الذكي للطوارئ - نموذج جدة من فريق ER Sync',
    heroTitle: ['الرعاية الصحيحة.', 'في المكان الصحيح.', 'في الوقت الصحيح.'],
    heroText: 'يجمع كيرفلو بين فحص أولي يضع السلامة أولا وبين بيانات مباشرة عن سعة المنشآت وأوقات الانتظار، ليساعدك على إيجاد المكان المناسب لتلقي الرعاية.',
    start: 'ابدأ التقييم المجاني',
    demoMode: 'وضع العرض',
    disclaimer: 'هذا ليس تشخيصا ولا يغني عن خدمات الطوارئ. في الحالات الطارئة اتصل بـ 997. جميع بيانات المنشآت والمرضى تجريبية.',
    demoTitle: 'جرّب كيرفلو مع مرضى افتراضيين',
    demoGuide: 'افتح دليل وضع العرض الكامل',
    demoCards: [
      {
        tag: 'السيناريو أ',
        title: 'تحذير طارئ',
        text: 'ألم شديد في الصدر بدأ قبل 20 دقيقة. يتوقف كيرفلو فورا ويعرض تعليمات الاتصال بـ 997 دون أي مقارنة بين المستشفيات.',
      },
      {
        tag: 'السيناريو ب',
        title: 'مطابقة المنشآت من البداية للنهاية',
        text: 'مريض مستقر يكمل التقييم، ويقارن المنشآت عبر البطاقات والخريطة، ثم يختار منشأة تستلم حالته.',
      },
      {
        tag: 'إعادة الترتيب المباشر',
        title: 'المستشفيات أ وب وج',
        text: 'يغير المسؤول وقت الانتظار في المستشفى ب من 15 إلى 100 دقيقة، فيعاد حساب الترتيب من قاعدة البيانات.',
      },
    ],
    runIt: 'جرّبه',
    howEyebrow: 'كيف يعمل',
    howTitle: 'رحلة متكاملة للمريض',
    steps: [
      { title: 'تسجيل موجه', text: 'تقييم حواري سهل يجمع الأعراض وشدتها ووقت بدايتها والتاريخ الصحي. دون الحاجة لإنشاء حساب.' },
      { title: 'قواعد السلامة أولا', text: 'تعمل قواعد العلامات التحذيرية الثابتة قبل أي شيء آخر. العلامات الخطيرة توقف التقييم وتعرض رقم 997.' },
      { title: 'مسار الرعاية', text: 'تحصل على فئة أولوية مبدئية ومسار مقترح، مع توضيح الأسباب.' },
      { title: 'مطابقة ذكية', text: 'ترتب المنشآت المؤهلة وفق درجة موزونة وشفافة تعتمد على مدة الوصول ووقت الانتظار والسعة.' },
      { title: 'توجه بثقة', text: 'قارن الخيارات على الخريطة، واختر منشأة واحصل على الاتجاهات. ويعلم المستشفى بقدومك.' },
    ],
    pathwaysEyebrow: 'مسارات الرعاية',
    pathwaysTitle: 'ثلاثة مسارات واضحة، مع شرح في كل مرة',
    pathways: [
      {
        title: 'المساعدة الطارئة',
        text: 'للعلامات التي قد تهدد الحياة مثل ألم الصدر الشديد أو علامات الجلطة الدماغية أو صعوبة التنفس الشديدة. يتم تخطي الترتيب المعتاد وتوجيهك للاتصال بـ 997.',
      },
      {
        title: 'قسم الطوارئ',
        text: 'للحالات ذات الأولوية العالية التي تحتاج تقييما سريعا. تؤخذ في الاعتبار فقط المنشآت التي لديها قسم طوارئ مفتوح وسعة متاحة.',
      },
      {
        title: 'الرعاية الأولية',
        text: 'للحالات غير العاجلة. تتم مطابقتك مع مراكز الرعاية الأولية والعيادات، لتبقى أقسام الطوارئ متاحة لمن يحتاجها.',
      },
    ],
    matchEyebrow: 'مطابقة شفافة',
    matchTitle: 'درجة يمكنك فهمها، وليست صندوقا أسود',
    matchText:
      'تستبعد أولا المنشآت التي تفتقر إلى خدمة مطلوبة أو المغلقة أو التي تحول المرضى أو الممتلئة. بعد ذلك فقط تقيم الخيارات المتبقية. لا يمكن لوقت انتظار قصير أن يتفوق على الملاءمة السريرية أو قواعد السلامة.',
    matchSteps: [
      'الخطوة 1: تطبيق قواعد السلامة للعلامات التحذيرية',
      'الخطوة 2: اختيار مسار الرعاية',
      'الخطوة 3: استبعاد المنشآت غير المناسبة',
      'الخطوة 4: الترتيب حسب الدرجة الموزونة',
      'الخطوة 5: شرح كل نتيجة مطابقة',
      'الخطوة 6: إعادة الترتيب فورا عند تغير بيانات المستشفى',
    ],
    weightsTitle: 'الأوزان لحالة ذات أولوية عالية',
    limitedNote: 'تخفض درجة المنشآت التي تعمل بخدمات محدودة بنسبة 10%.',
    teamsAlt: 'ممرضة تراجع ملاحظات بالقرب من لافتة قسم الطوارئ',
    teamsTitle: 'مصمم لفرق المستشفيات أيضا',
    teamsText:
      'يرى المسؤولون المرضى القادمين وتوزيع الأولويات وملخصات التقييمات الأخيرة لمنشآتهم، ويحدثون وقت الانتظار والسعة وتوفر الخدمات. وكل تغيير يعيد تشكيل توصيات المرضى فورا.',
    teamsCta: 'افتح لوحة المستشفى',
  },
};

const arrow = 'h-4 w-4 transition-transform rtl:rotate-180';

export default function Home() {
  const lang = getLang();
  const t = COPY[lang];
  const weights = WEIGHT_PROFILES.high;
  const maxWeight = Math.max(...Object.values(weights));
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 text-white">
          <div className="bg-grid absolute inset-0 opacity-10 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
          <div className="absolute -top-40 end-0 h-[480px] w-[480px] rounded-full bg-teal-400/20 blur-3xl" />
          <div className="absolute -bottom-40 -start-20 h-[360px] w-[360px] rounded-full bg-sky-500/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:pt-24">
            <div className="space-y-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-teal-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
                {t.badge}
              </span>
              <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                {t.heroTitle[0]} <span className="text-teal-300">{t.heroTitle[1]}</span> {t.heroTitle[2]}
              </h1>
              <p className="max-w-xl text-lg text-slate-300">{t.heroText}</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/assess"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-3.5 font-semibold text-navy-950 shadow-lg shadow-teal-900/30 transition-all hover:-translate-y-0.5 hover:bg-teal-400"
                >
                  {t.start}
                  <ArrowRight className={`${arrow} group-hover:translate-x-1 rtl:group-hover:-translate-x-1`} />
                </Link>
                <Link
                  href="#demo-mode"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <PlayCircle className="h-4 w-4" /> {t.demoMode}
                </Link>
              </div>
              <p className="flex items-start gap-2 text-sm text-slate-400">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                {t.disclaimer}
              </p>
            </div>
            <HeroPreview lang={lang} />
          </div>
        </section>

        <section id="demo-mode" className="scroll-mt-20 bg-navy-950 py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-wider text-teal-300">{t.demoMode}</p>
                <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{t.demoTitle}</h2>
              </div>
              <Link href="/demo" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-300 hover:text-teal-200">
                {t.demoGuide} <ArrowRight className={arrow} />
              </Link>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {t.demoCards.map((c, i) => {
                const s = DEMO_STYLE[i];
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className={`group relative flex flex-col rounded-2xl bg-gradient-to-b p-6 ring-1 transition-all hover:-translate-y-1 hover:bg-white/5 ${s.tone}`}
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.iconTone}`}>
                      <s.icon className="h-5 w-5" />
                    </span>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">{c.tag}</p>
                    <h3 className="mt-1 text-xl font-bold text-white">{c.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-slate-300">{c.text}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                      {t.runIt} <ArrowRight className={`${arrow} group-hover:translate-x-1 rtl:group-hover:-translate-x-1`} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">{t.howEyebrow}</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{t.howTitle}</h2>
            </div>
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {t.steps.map((s, i) => {
                const Icon = STEP_ICONS[i];
                return (
                  <li key={s.title} className="group relative rounded-2xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
                    <span className="absolute end-5 top-5 font-display text-sm font-bold text-slate-300">0{i + 1}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-semibold text-slate-900">{s.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{s.text}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">{t.pathwaysEyebrow}</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{t.pathwaysTitle}</h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {t.pathways.map((p, i) => {
                const s = PATHWAY_STYLE[i];
                return (
                  <div key={p.title} className={`rounded-2xl border p-8 ${s.tone}`}>
                    <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.iconTone}`}>
                      <s.icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-6 text-xl font-bold text-slate-900">{p.title}</h3>
                    <p className="mt-3 text-slate-700">{p.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-navy-900 py-20 text-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-teal-300">{t.matchEyebrow}</p>
              <h2 className="text-3xl font-bold sm:text-4xl">{t.matchTitle}</h2>
              <p className="text-slate-300">{t.matchText}</p>
              <ul className="space-y-3 text-sm text-slate-300">
                {t.matchSteps.map((step) => (
                  <li key={step} className="flex items-center gap-3">
                    <ClipboardCheck className="h-4 w-4 shrink-0 text-teal-300" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <p className="text-sm font-medium text-slate-300">{t.weightsTitle}</p>
              <div className="mt-6 space-y-5">
                {(Object.entries(weights) as [keyof MatchWeights, number][]).map(([k, w]) => (
                  <div key={k}>
                    <div className="flex justify-between text-sm">
                      <span>{factorLabel(k, lang)}</span>
                      <span className="font-semibold text-teal-300">{Math.round(w * 100)}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-sky-400 rtl:bg-gradient-to-l" style={{ width: `${(w / maxWeight) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-slate-400">{t.limitedNote}</p>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 overflow-hidden px-4 sm:px-6 lg:grid-cols-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.pexels.com/photos/6129194/pexels-photo-6129194.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt={t.teamsAlt}
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl"
            />
            <div className="space-y-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <Building2 className="h-6 w-6" />
              </span>
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">{t.teamsTitle}</h2>
              <p className="text-slate-600">{t.teamsText}</p>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-navy-800"
              >
                {t.teamsCta} <ArrowRight className={arrow} />
              </Link>
            </div>
          </div>
        </section>

        <VisionSection />
      </main>
      <SiteFooter />
    </div>
  );
}
