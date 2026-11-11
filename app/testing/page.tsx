import Link from 'next/link';
import { Bug, CheckCircle2, CircleDashed, FlaskConical, Globe, ListChecks, ShieldCheck, Terminal } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { getLang } from '@/lib/i18n/server';
import type { Copy } from '@/lib/i18n/config';

export const metadata = { title: 'How we tested | CareFlow' };

type Row = { what: string; result: string };
type Method = { title: string; count: string; how: string; rows: Row[] };

const COPY: Copy<{
  eyebrow: string;
  title: string;
  intro: string;
  summary: { value: string; label: string }[];
  methodsTitle: string;
  methods: Method[];
  whatCol: string;
  resultCol: string;
  fixedTitle: string;
  fixed: string[];
  notTitle: string;
  notIntro: string;
  not: string[];
  nextTitle: string;
  next: string[];
  run: string;
  demoLink: string;
}> = {
  en: {
    eyebrow: 'Testing and validation',
    title: 'How we tested CareFlow',
    intro:
      'What we tested, how we tested it, what the results show, and what has not been tested yet. All testing used synthetic patients, facilities and accounts.',
    summary: [
      { value: '34', label: 'automated logic tests, all passing' },
      { value: '8', label: 'database permission tests' },
      { value: '2', label: 'languages tested end to end' },
      { value: '0', label: 'known open defects in the demo flows' },
    ],
    methodsTitle: 'What we tested and how',
    methods: [
      {
        title: 'Safety rules (triage)',
        count: '9 automated tests',
        how: 'Automated tests feed fixed symptom combinations into the triage engine and check the pathway it returns.',
        rows: [
          { what: 'Severe chest pain, stroke signs, breathing difficulty, heavy bleeding, seizure, loss of consciousness', result: 'Always "Call 997", facility ranking never shown' },
          { what: 'Poisoning or overdose, in English and Arabic ("أخذ حبوب كثير", "بلع كلوركس")', result: 'Emergency path triggered' },
          { what: 'Arabic free text ("عندي ألم شديد في الصدر")', result: 'Recognised by the built-in rules, even without AI' },
          { what: 'A simple fall ("طحت من الدرج")', result: 'Classified as an injury, not loss of consciousness' },
        ],
      },
      {
        title: 'Matching algorithm',
        count: '14 automated tests',
        how: 'Tests build facilities at known distances and waits, then check eligibility, scores and ranking order.',
        rows: [
          { what: 'Closed, full or diverting facilities', result: 'Excluded before scoring, with the reason shown' },
          { what: 'Hospital B wait changed from 15 to 100 minutes', result: 'Ranking changes from B, A, C to A, C, B' },
          { what: 'Score bounds and weights', result: 'Scores stay between 0 and 100; weights sum to 100%' },
          { what: 'Time saved vs nearest suitable facility', result: 'Calculated correctly, hidden when the nearest is already best' },
        ],
      },
      {
        title: 'Impact simulation, case creation and location sharing',
        count: '11 automated tests',
        how: 'Tests check that simulated patients are reproducible and never emergencies, and that cases sent to a facility have the right content.',
        rows: [
          { what: '100 synthetic patients through the real algorithm', result: 'Same seed gives the same result; only suitable facilities are used' },
          { what: 'Case sent to a facility', result: 'Contains the screening summary and the correct facility' },
          { what: 'Emergency location message in Arabic and English', result: 'Contains an exact Google Maps link; WhatsApp and SMS links are encoded safely' },
        ],
      },
      {
        title: 'Security and permissions',
        count: '8 database tests',
        how: 'Tests sign in with real demo accounts on the live database and try actions that must be refused.',
        rows: [
          { what: 'Visitor tries to change hospital data or read patient cases', result: 'Refused' },
          { what: "Hospital admin edits another facility, or protected fields like name and location", result: 'Refused' },
          { what: 'Hospital admin updates their own wait time, capacity, doctors', result: 'Allowed' },
          { what: 'Patient without an account submits a case', result: 'Accepted and appears on the right dashboard' },
        ],
      },
      {
        title: 'Live website (manual, in a browser)',
        count: 'English + Arabic, mobile + desktop',
        how: 'We used the deployed website the way a patient and a hospital administrator would.',
        rows: [
          { what: 'Scenario A (severe chest pain)', result: 'Emergency screen with 997 immediately, in both languages' },
          { what: 'Scenario B (fever and cough)', result: 'Primary care pathway, 3 ranked facilities, map, "20 minutes sooner" banner' },
          { what: 'AI symptom extraction (Gemini) in Arabic and English', result: 'Working; caught "حرارته مرتفعة" (fever) that keyword rules missed' },
          { what: 'Hospital dashboard: change wait, watch re-ranking, reset demo data', result: 'Re-ranking live on the Demo page; reset restores the original values' },
          { what: 'Phone screen width (375 px)', result: 'No horizontal scrolling; all buttons reachable' },
        ],
      },
    ],
    whatCol: 'What we checked',
    resultCol: 'Result',
    fixedTitle: 'Problems testing found, and fixed',
    fixed: [
      'The assessment chat stayed blank on the hosted site: a hosting-added code comment broke page start-up. Fixed and re-tested.',
      'The site failed to build on the host because of a font download issue. Fixed by loading fonts in the browser.',
      'AI symptom extraction was silently off on the hosted site. Added a status check and fallback model names; now confirmed working.',
      'Arabic layout issues on the hospital sign-in and settings screens (wrapped button, overlapping label). Fixed.',
    ],
    notTitle: 'What has not been tested yet',
    notIntro: 'Being clear about limits is part of responsible design.',
    not: [
      'Clinical validation: the safety rules and scoring weights are illustrative and have not been reviewed by clinicians.',
      'Real patients and real hospital data: everything is synthetic.',
      'Real travel times: arrival times are estimated from distance, not live traffic.',
      'Load testing: we have not tested many users at the same time.',
      'Accessibility audit with screen-reader users.',
    ],
    nextTitle: 'Next tests we would run',
    next: [
      'Review the safety rules and urgency levels with emergency physicians.',
      'Usability sessions with patients and hospital staff in Arabic and English.',
      'Compare recommendations with real waiting-time data from a partner hospital.',
    ],
    run: 'Developers can re-run the automated tests with npm test (logic) and npm run test:db (permissions).',
    demoLink: 'See the impact simulation',
  },
  ar: {
    eyebrow: 'الاختبار والتحقق',
    title: 'كيف اختبرنا CareFlow',
    intro: 'ماذا اختبرنا، وكيف اختبرنا، وماذا تثبت النتائج، وما الذي لم يُختبر بعد. جميع الاختبارات استخدمت مرضى ومنشآت وحسابات تجريبية.',
    summary: [
      { value: '34', label: 'اختبارا آليا للمنطق، جميعها ناجحة' },
      { value: '8', label: 'اختبارات صلاحيات على قاعدة البيانات' },
      { value: '2', label: 'لغتان تم اختبارهما بالكامل' },
      { value: '0', label: 'أخطاء معروفة مفتوحة في مسارات العرض' },
    ],
    methodsTitle: 'ماذا اختبرنا وكيف',
    methods: [
      {
        title: 'قواعد السلامة (الفرز)',
        count: '9 اختبارات آلية',
        how: 'تدخل الاختبارات الآلية تركيبات أعراض محددة إلى محرك الفرز وتتحقق من المسار الذي يعيده.',
        rows: [
          { what: 'ألم صدر شديد، علامات جلطة، صعوبة تنفس، نزيف شديد، تشنج، فقدان وعي', result: 'دائما "اتصل بـ 997" ولا يظهر ترتيب المنشآت أبدا' },
          { what: 'تسمم أو جرعة زائدة بالعربي والإنجليزي ("أخذ حبوب كثير"، "بلع كلوركس")', result: 'يتفعل مسار الطوارئ' },
          { what: 'نص عربي حر ("عندي ألم شديد في الصدر")', result: 'تتعرف عليه القواعد المدمجة حتى بدون ذكاء اصطناعي' },
          { what: 'سقوط بسيط ("طحت من الدرج")', result: 'يُصنف كإصابة وليس فقدان وعي' },
        ],
      },
      {
        title: 'خوارزمية الترشيح',
        count: '14 اختبارا آليا',
        how: 'تنشئ الاختبارات منشآت بمسافات وأوقات انتظار معروفة، ثم تتحقق من الأهلية والدرجات وترتيب النتائج.',
        rows: [
          { what: 'منشآت مغلقة أو ممتلئة أو تحول المرضى', result: 'تُستبعد قبل حساب الدرجة مع توضيح السبب' },
          { what: 'تغيير انتظار المستشفى ب من 15 إلى 100 دقيقة', result: 'يتغير الترتيب من ب، أ، ج إلى أ، ج، ب' },
          { what: 'حدود الدرجات والأوزان', result: 'الدرجات بين 0 و100 ومجموع الأوزان 100%' },
          { what: 'الوقت الموفر مقارنة بأقرب منشأة مناسبة', result: 'يُحسب بشكل صحيح ويُخفى إذا كانت الأقرب هي الأفضل' },
        ],
      },
      {
        title: 'محاكاة الأثر وإنشاء الحالات ومشاركة الموقع',
        count: '11 اختبارا آليا',
        how: 'تتحقق الاختبارات من أن المرضى الافتراضيين قابلون للتكرار وليسوا حالات طارئة، وأن الحالات المرسلة للمنشأة صحيحة.',
        rows: [
          { what: '100 مريض افتراضي عبر الخوارزمية الحقيقية', result: 'نفس البذرة تعطي نفس النتيجة، وتُستخدم المنشآت المناسبة فقط' },
          { what: 'إرسال حالة إلى منشأة', result: 'تتضمن ملخص الفحص والمنشأة الصحيحة' },
          { what: 'رسالة الموقع في الطوارئ بالعربي والإنجليزي', result: 'تتضمن رابط خرائط Google دقيق، وروابط واتساب والرسائل مرمزة بشكل آمن' },
        ],
      },
      {
        title: 'الأمان والصلاحيات',
        count: '8 اختبارات على قاعدة البيانات',
        how: 'تسجل الاختبارات الدخول بحسابات العرض الحقيقية على قاعدة البيانات المباشرة وتحاول تنفيذ عمليات يجب رفضها.',
        rows: [
          { what: 'زائر يحاول تعديل بيانات مستشفى أو قراءة حالات المرضى', result: 'مرفوض' },
          { what: 'مسؤول مستشفى يعدل منشأة أخرى أو حقولا محمية مثل الاسم والموقع', result: 'مرفوض' },
          { what: 'مسؤول مستشفى يحدث وقت الانتظار والسعة والأطباء لمنشأته', result: 'مسموح' },
          { what: 'مريض بدون حساب يرسل حالة', result: 'مقبولة وتظهر في لوحة المنشأة الصحيحة' },
        ],
      },
      {
        title: 'الموقع المباشر (يدويا في المتصفح)',
        count: 'عربي + إنجليزي، جوال + كمبيوتر',
        how: 'استخدمنا الموقع المنشور كما يستخدمه المريض ومسؤول المستشفى.',
        rows: [
          { what: 'السيناريو أ (ألم صدر شديد)', result: 'شاشة الطوارئ و997 فورا باللغتين' },
          { what: 'السيناريو ب (حمى وكحة)', result: 'مسار الرعاية الأولية، 3 منشآت مرتبة، خريطة، وشريط "أسرع بـ 20 دقيقة"' },
          { what: 'استخراج الأعراض بالذكاء الاصطناعي (Gemini) بالعربي والإنجليزي', result: 'يعمل، والتقط "حرارته مرتفعة" (حمى) التي فاتت القواعد' },
          { what: 'لوحة المستشفى: تغيير الانتظار، متابعة إعادة الترتيب، إعادة ضبط البيانات', result: 'إعادة الترتيب مباشرة في صفحة العرض، وإعادة الضبط تستعيد القيم الأصلية' },
          { what: 'عرض شاشة الجوال (375 بكسل)', result: 'لا تمرير أفقي وجميع الأزرار في متناول اليد' },
        ],
      },
    ],
    whatCol: 'ما الذي تحققنا منه',
    resultCol: 'النتيجة',
    fixedTitle: 'مشاكل اكتشفها الاختبار وتم إصلاحها',
    fixed: [
      'محادثة التقييم ظهرت فارغة على الموقع المستضاف بسبب تعليق برمجي تضيفه الاستضافة. تم الإصلاح وإعادة الاختبار.',
      'فشل بناء الموقع على الاستضافة بسبب مشكلة في تحميل الخطوط. تم الإصلاح بتحميل الخطوط في المتصفح.',
      'استخراج الأعراض بالذكاء الاصطناعي كان متوقفا دون إشعار. أضفنا فحصا للحالة وأسماء نماذج بديلة، وتأكدنا أنه يعمل الآن.',
      'مشاكل في تنسيق العربي في شاشتي دخول وإعدادات المستشفى (زر ملتف ونص متداخل). تم الإصلاح.',
    ],
    notTitle: 'ما الذي لم يُختبر بعد',
    notIntro: 'الوضوح بشأن الحدود جزء من التصميم المسؤول.',
    not: [
      'التحقق السريري: قواعد السلامة وأوزان الترشيح توضيحية ولم يراجعها أطباء.',
      'مرضى حقيقيون وبيانات مستشفيات حقيقية: كل البيانات تجريبية.',
      'أوقات وصول حقيقية: أوقات الوصول تقديرية من المسافة وليست من حركة المرور المباشرة.',
      'اختبار الضغط: لم نختبر عددا كبيرا من المستخدمين في نفس الوقت.',
      'تدقيق إمكانية الوصول مع مستخدمي قارئات الشاشة.',
    ],
    nextTitle: 'الاختبارات القادمة',
    next: [
      'مراجعة قواعد السلامة ومستويات الاستعجال مع أطباء طوارئ.',
      'جلسات تجربة استخدام مع مرضى وموظفي مستشفيات بالعربي والإنجليزي.',
      'مقارنة التوصيات ببيانات أوقات انتظار حقيقية من مستشفى شريك.',
    ],
    run: 'يمكن للمطورين إعادة تشغيل الاختبارات الآلية عبر npm test (المنطق) و npm run test:db (الصلاحيات).',
    demoLink: 'شاهد محاكاة الأثر',
  },
};

const ICONS = [ShieldCheck, ListChecks, FlaskConical, ShieldCheck, Globe];

export default function TestingPage() {
  const lang = getLang();
  const t = COPY[lang];
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

        <section className="mx-auto -mt-8 grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {t.summary.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <p className="font-display text-4xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-slate-600">{s.label}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-slate-900">{t.methodsTitle}</h2>
          <div className="mt-6 space-y-6">
            {t.methods.map((m, i) => {
              const Icon = ICONS[i] ?? ShieldCheck;
              return (
                <article key={m.title} className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">{m.title}</h3>
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{m.count}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{m.how}</p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead>
                        <tr className="text-start text-xs uppercase tracking-wide text-slate-500">
                          <th className="py-2 pe-4 text-start font-semibold">{t.whatCol}</th>
                          <th className="py-2 text-start font-semibold">{t.resultCol}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.rows.map((r) => (
                          <tr key={r.what} className="border-t border-border align-top">
                            <td className="py-3 pe-4 text-slate-800">{r.what}</td>
                            <td className="py-3">
                              <span className="inline-flex items-start gap-1.5 font-medium text-emerald-800">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {r.result}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-14 sm:px-6 lg:grid-cols-3">
          <article className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-amber-950">
              <Bug className="h-5 w-5" /> {t.fixedTitle}
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-amber-950">
              {t.fixed.map((f) => (
                <li key={f} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /> {f}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-3xl border border-slate-300 bg-white p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <CircleDashed className="h-5 w-5" /> {t.notTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{t.notIntro}</p>
            <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-slate-700">
              {t.not.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-3xl border border-teal-200 bg-teal-50 p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-teal-950">
              <FlaskConical className="h-5 w-5" /> {t.nextTitle}
            </h2>
            <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-teal-950">
              {t.next.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5">
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <Terminal className="h-4 w-4" /> {t.run}
            </p>
            <Link href="/demo#impact" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">
              {t.demoLink}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
