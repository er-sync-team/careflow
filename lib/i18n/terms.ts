import type { CaseStatus, Hospital, OperationalStatus, Pathway, Sex, Urgency } from '../types';
import type { MatchWeights } from '../matching';
import { HISTORY_LABELS, ONSET_OPTIONS, SCREENING_QUESTIONS, SEVERITY_OPTIONS, SPECIALTY_LABELS, SYMPTOM_LABELS } from '../triage/catalog';
import { PATHWAY_META, URGENCY_META } from '../triage/engine';
import { DEMO_LOCATIONS } from '../geo';
import type { Lang } from './config';

const SYMPTOM_AR: Record<string, string> = {
  chest_pain: 'ألم أو ضغط في الصدر',
  shortness_of_breath: 'صعوبة في التنفس',
  stroke_signs: 'تدلي الوجه أو ضعف الذراع أو تلعثم الكلام',
  unconscious: 'إغماء أو فقدان الوعي',
  seizure: 'نوبة تشنج',
  severe_bleeding: 'نزيف شديد لا يتوقف',
  poisoning: 'تسمم أو جرعة زائدة',
  severe_headache: 'صداع شديد',
  abdominal_pain: 'ألم في البطن',
  high_fever: 'حمى',
  injury: 'إصابة أو سقوط أو كسر محتمل',
  burn: 'حرق',
  allergic_reaction: 'رد فعل تحسسي أو تورم',
  vomiting: 'قيء أو إسهال',
  dizziness: 'دوخة',
  cough: 'سعال أو أعراض زكام',
  sore_throat: 'التهاب الحلق',
  ear_pain: 'ألم في الأذن',
  rash: 'طفح جلدي أو حكة',
  urinary_pain: 'ألم عند التبول',
  back_pain: 'ألم في الظهر أو المفاصل',
};

const HISTORY_AR: Record<string, string> = {
  heart_disease: 'أمراض القلب',
  hypertension: 'ارتفاع ضغط الدم',
  diabetes: 'السكري',
  asthma: 'الربو أو أمراض الرئة',
  pregnancy: 'حامل حاليا',
  immunocompromised: 'ضعف المناعة',
  blood_thinners: 'أتناول مميعات الدم',
};

const SEVERITY_AR: Record<string, { label: string; hint: string }> = {
  mild: { label: 'خفيفة', hint: 'ملحوظة، لكن يمكنني ممارسة أنشطتي المعتادة' },
  moderate: { label: 'متوسطة', hint: 'تؤثر على ما أستطيع فعله اليوم' },
  severe: { label: 'شديدة', hint: 'شديدة جدا، ويصعب علي فعل أي شيء' },
};

const ONSET_AR: Record<string, string> = {
  hour: 'خلال الساعة الماضية',
  today: 'في وقت سابق اليوم',
  days: 'قبل يوم إلى 3 أيام',
  week: 'قبل أكثر من 3 أيام',
};

const SCREENING_AR: Record<string, { text: string; flag: string }> = {
  chest_radiating: {
    text: 'هل ينتشر ألم الصدر إلى الذراع أو الفك أو الرقبة أو الظهر، أو يصاحبه تعرق أو غثيان أو ضيق تنفس؟',
    flag: 'ألم في الصدر ينتشر أو تصاحبه أعراض أخرى',
  },
  breath_severe: {
    text: 'هل أنت غير قادر على إكمال الجمل، أو تحول لون شفتيك أو وجهك إلى الأزرق أو الرمادي؟',
    flag: 'صعوبة شديدة في التنفس',
  },
  allergy_airway: {
    text: 'هل يوجد تورم في الشفتين أو اللسان أو الحلق، أو أي صعوبة في التنفس أو البلع؟',
    flag: 'رد فعل تحسسي يؤثر على مجرى التنفس',
  },
  headache_thunderclap: {
    text: 'هل بدأ الصداع فجأة وكأنه أسوأ صداع في حياتك، أو يصاحبه ارتباك أو ضعف أو فقدان للرؤية؟',
    flag: 'صداع مفاجئ وشديد مع علامات تحذيرية',
  },
  fever_meningitis: {
    text: 'هل لديك تيبس في الرقبة أو ارتباك أو طفح جلدي لا يختفي عند الضغط عليه؟',
    flag: 'حمى مع تيبس الرقبة أو ارتباك أو طفح لا يختفي',
  },
  abdominal_red: {
    text: 'هل تتقيأ دما أو يكون البراز أسود اللون، أو أن بطنك متصلب ومؤلم جدا عند اللمس؟',
    flag: 'أعراض في البطن مع احتمال نزيف داخلي',
  },
  pregnancy_bleeding: {
    text: 'هل تعانين من نزيف مهبلي أو تسرب سوائل أو قلة حركة الجنين؟',
    flag: 'علامة تحذيرية مرتبطة بالحمل',
  },
  injury_deformity: {
    text: 'هل يوجد تشوه واضح، أو لا تستطيع تحريك الجزء المصاب أو الوقوف عليه، أو تعرضت لضربة في الرأس؟',
    flag: 'إصابة مع احتمال كسر أو ضربة في الرأس',
  },
  burn_large: {
    text: 'هل الحرق أكبر من كف اليد، أو في الوجه أو اليدين أو منطقة العانة أو أحد المفاصل؟',
    flag: 'حرق كبير أو في منطقة حساسة',
  },
  dehydration: {
    text: 'هل عجزت عن الاحتفاظ بأي سوائل لأكثر من 12 ساعة، أو تتبول بكمية قليلة جدا؟',
    flag: 'احتمال الجفاف',
  },
  rapid_worsening: {
    text: 'هل تزداد أعراضك سوءا بسرعة الآن؟',
    flag: 'أعراض تزداد سوءا بسرعة',
  },
};

const SPECIALTY_AR: Record<string, string> = {
  emergency_medicine: 'طب الطوارئ',
  cardiology: 'أمراض القلب',
  neurology: 'الأعصاب',
  orthopedics: 'العظام',
  pediatrics: 'طب الأطفال',
  obstetrics: 'النساء والولادة',
  general_surgery: 'الجراحة العامة',
  internal_medicine: 'الباطنية',
  pulmonology: 'الأمراض الصدرية',
  family_medicine: 'طب الأسرة',
  dermatology: 'الجلدية',
  ent: 'الأنف والأذن والحنجرة',
};

const URGENCY_AR: Record<Urgency, string> = {
  low: 'أولوية منخفضة',
  moderate: 'أولوية متوسطة',
  high: 'أولوية عالية',
  emergency: 'طوارئ',
};

const PATHWAY_AR: Record<Pathway, { label: string; short: string }> = {
  emergency_assistance: { label: 'مساعدة طارئة', short: 'اتصل بـ 997 الآن' },
  emergency_department: { label: 'التقييم في قسم الطوارئ', short: 'توجه إلى قسم الطوارئ' },
  primary_care: { label: 'الرعاية الأولية', short: 'توجه إلى مركز رعاية أولية' },
};

const STATUS_LABEL: Record<Lang, Record<OperationalStatus, string>> = {
  en: { open: 'Open', limited: 'Limited services', diverting: 'ED diverting', closed: 'Closed' },
  ar: { open: 'مفتوح', limited: 'خدمات محدودة', diverting: 'الطوارئ تحول المرضى', closed: 'مغلق' },
};

const CAPACITY_AR: Record<string, string> = {
  Available: 'متاح',
  Busy: 'مزدحم',
  'Near capacity': 'قريب من الامتلاء',
  Full: 'ممتلئ',
};

const FACTOR_LABEL: Record<Lang, Record<keyof MatchWeights, string>> = {
  en: {
    travel: 'Travel time',
    timeToCare: 'Time until care (travel + wait)',
    capacity: 'Free capacity',
    specialty: 'Relevant specialty',
    staffing: 'Doctors on duty',
  },
  ar: {
    travel: 'مدة الوصول',
    timeToCare: 'الوقت حتى تلقي الرعاية (الوصول + الانتظار)',
    capacity: 'السعة المتاحة',
    specialty: 'التخصص المناسب',
    staffing: 'الأطباء المناوبون',
  },
};

const LOCATION_AR: Record<string, string> = {
  rawdah: 'الروضة',
  andalus: 'الأندلس',
  safa: 'الصفا',
  salamah: 'السلامة',
  obhur: 'أبحر الشمالية',
  balad: 'البلد (المنطقة التاريخية)',
};

const CASE_STATUS: Record<Lang, Record<CaseStatus | 'assessed', string>> = {
  en: { assessed: 'Assessed', incoming: 'Incoming', arrived: 'Arrived', in_treatment: 'In treatment', discharged: 'Discharged', redirected: 'Redirected' },
  ar: { assessed: 'تم التقييم', incoming: 'قادم', arrived: 'وصل', in_treatment: 'قيد العلاج', discharged: 'خرج', redirected: 'أعيد توجيهه' },
};

const SEX_LABEL: Record<Lang, Record<Sex, string>> = {
  en: { male: 'Male', female: 'Female', unspecified: 'Prefer not to say' },
  ar: { male: 'ذكر', female: 'أنثى', unspecified: 'أفضل عدم الإجابة' },
};

const pick = (lang: Lang, en: string, ar: string | undefined) => (lang === 'ar' && ar ? ar : en);

export const symptomLabel = (id: string, lang: Lang) => pick(lang, SYMPTOM_LABELS[id] ?? id, SYMPTOM_AR[id]);
export const historyLabel = (id: string, lang: Lang) => pick(lang, HISTORY_LABELS[id] ?? id, HISTORY_AR[id]);
export const specialtyLabel = (id: string, lang: Lang) => pick(lang, SPECIALTY_LABELS[id] ?? id, SPECIALTY_AR[id]);
export const urgencyLabel = (u: Urgency, lang: Lang) => pick(lang, URGENCY_META[u].label, URGENCY_AR[u]);
export const pathwayLabel = (p: Pathway, lang: Lang) => pick(lang, PATHWAY_META[p].label, PATHWAY_AR[p].label);
export const pathwayShort = (p: Pathway, lang: Lang) => pick(lang, PATHWAY_META[p].short, PATHWAY_AR[p].short);
export const statusLabel = (s: OperationalStatus, lang: Lang) => STATUS_LABEL[lang][s];
export const capacityText = (label: string, lang: Lang) => pick(lang, label, CAPACITY_AR[label]);
export const factorLabel = (key: keyof MatchWeights, lang: Lang) => FACTOR_LABEL[lang][key];
export const caseStatusLabel = (s: string, lang: Lang) => CASE_STATUS[lang][s as CaseStatus] ?? s;
export const sexLabel = (s: Sex, lang: Lang) => SEX_LABEL[lang][s] ?? s;

export function severityOption(id: string, lang: Lang) {
  const en = SEVERITY_OPTIONS.find((o) => o.id === id);
  const ar = SEVERITY_AR[id];
  if (lang === 'ar' && ar) return ar;
  return { label: en?.label ?? id, hint: en?.hint ?? '' };
}

export const onsetLabel = (id: string, lang: Lang) => pick(lang, ONSET_OPTIONS.find((o) => o.id === id)?.label ?? id, ONSET_AR[id]);

export function screeningText(id: string, lang: Lang) {
  const q = SCREENING_QUESTIONS.find((s) => s.id === id);
  return pick(lang, q?.text ?? id, SCREENING_AR[id]?.text);
}

export function locationLabel(id: string, lang: Lang) {
  return pick(lang, DEMO_LOCATIONS.find((l) => l.id === id)?.label ?? id, LOCATION_AR[id]);
}

type Named = Pick<Hospital, 'name' | 'district'> & { name_ar?: string | null; district_ar?: string | null };
export const hospitalName = (h: Named, lang: Lang) => pick(lang, h.name, h.name_ar ?? undefined);
export const hospitalDistrict = (h: Named, lang: Lang) => pick(lang, h.district, h.district_ar ?? undefined);

const reverse = (en: Record<string, string>, ar: Record<string, string>) =>
  Object.fromEntries(Object.entries(en).filter(([id]) => ar[id]).map(([id, label]) => [label, ar[id]]));

const PHRASES_AR: Record<string, string> = {
  ...Object.fromEntries(SCREENING_QUESTIONS.map((q) => [q.yesFlag, SCREENING_AR[q.id]?.flag ?? q.yesFlag])),
  'Possible stroke signs (face, arm or speech changes)': 'علامات محتملة لجلطة دماغية (تغيرات في الوجه أو الذراع أو الكلام)',
  'Loss of consciousness or fainting': 'فقدان الوعي أو الإغماء',
  'Seizure or convulsions': 'نوبة تشنج',
  'Heavy, uncontrolled bleeding': 'نزيف شديد لا يمكن السيطرة عليه',
  'Possible poisoning or overdose': 'اشتباه تسمم أو جرعة زائدة',
  'Severe chest pain': 'ألم شديد في الصدر',
  'Sudden severe headache': 'صداع شديد مفاجئ',
  'Severe breathing difficulty': 'صعوبة شديدة في التنفس',
  'Severe symptom intensity raises the priority by one level': 'شدة الأعراض العالية ترفع الأولوية درجة واحدة',
  'Infants under 1 year are prioritized': 'يعطى الرضع دون سنة واحدة الأولوية',
  'Age 65 or older raises the priority': 'العمر 65 عاما أو أكثر يرفع الأولوية',
  'Known heart disease with cardiac-type symptoms': 'مرض قلبي معروف مع أعراض قلبية',
  'Fever with a weakened immune system': 'حمى مع ضعف المناعة',
  'High priority: an emergency department can assess you promptly': 'أولوية عالية: يمكن لقسم الطوارئ تقييم حالتك بسرعة',
  'Injuries and burns may need imaging or procedures available in an emergency department':
    'قد تحتاج الإصابات والحروق إلى أشعة أو إجراءات متوفرة في قسم الطوارئ',
  'No warning signs found: a same-day primary care visit is suggested': 'لا توجد علامات تحذيرية: ننصح بزيارة الرعاية الأولية في اليوم نفسه',
  'No warning signs found: a primary care center or clinic is suitable': 'لا توجد علامات تحذيرية: مركز الرعاية الأولية أو العيادة مناسب لحالتك',
  'Operational data unavailable, facility not ranked': 'البيانات التشغيلية غير متوفرة، لم يتم تصنيف المنشأة',
  'Facility is currently closed': 'المنشأة مغلقة حاليا',
  'No emergency department': 'لا يوجد قسم طوارئ',
  'Emergency department is diverting new patients': 'قسم الطوارئ يحول المرضى الجدد إلى منشآت أخرى',
  'Not a primary care facility (emergency departments are reserved for urgent cases)':
    'ليست منشأة رعاية أولية (أقسام الطوارئ مخصصة للحالات العاجلة)',
  'No available capacity': 'لا توجد سعة متاحة',
  'Emergency department open and accepting patients': 'قسم الطوارئ مفتوح ويستقبل المرضى',
  'Primary care facility suitable for non-urgent care': 'منشأة رعاية أولية مناسبة للحالات غير العاجلة',
  'Operating with limited services (score reduced 10%)': 'تعمل بخدمات محدودة (خفض التقييم 10%)',
  'Initial screening completed': 'اكتمل الفحص الأولي',
  'Patient checked in at reception': 'سجل المريض وصوله في الاستقبال',
  'Patient redirected to another facility': 'أعيد توجيه المريض إلى منشأة أخرى',
  'Seen by clinician': 'تمت معاينته من قبل الطبيب',
  'Discharged with follow-up advice': 'خرج مع إرشادات للمتابعة',
  'We could not load facility information. Please try again.': 'تعذر تحميل بيانات المنشآت. يرجى المحاولة مرة أخرى.',
  none: 'لا يوجد',
};

const SYMPTOM_BY_LABEL = reverse(SYMPTOM_LABELS, SYMPTOM_AR);
const SPECIALTY_BY_LABEL = reverse(SPECIALTY_LABELS, SPECIALTY_AR);
const SEVERITY_BY_ID = Object.fromEntries(Object.entries(SEVERITY_AR).map(([id, v]) => [id, v.label]));

const PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Warning sign reported: (.+)$/, (m) => `علامة تحذيرية: ${phraseAr(m[1])}`],
  [
    /^Reported: (.+) \((\w+)\)$/,
    (m) => `الأعراض المبلغ عنها: ${splitLabels(m[1]).map((l) => SYMPTOM_BY_LABEL[l] ?? l).join('، ')} (${SEVERITY_BY_ID[m[2]] ?? m[2]})`,
  ],
  [/^Offers (.+)$/, (m) => `تقدم خدمة ${SPECIALTY_BY_LABEL[m[1]] ?? m[1]}`],
  [/^Does not list (.+), general care available$/, (m) => `لا تدرج ${SPECIALTY_BY_LABEL[m[1]] ?? m[1]}، وتتوفر رعاية عامة`],
  [/^About (\d+) min away \(simulated\) and ~(\d+) min estimated wait$/, (m) => `تبعد حوالي ${m[1]} دقيقة (محاكاة) ومدة الانتظار المتوقعة ~${m[2]} دقيقة`],
  [/^(Available|Busy|Near capacity|Full): (\d+)\/(\d+) beds or slots in use$/, (m) => `${CAPACITY_AR[m[1]]}: ${m[2]}/${m[3]} من الأسرة أو المواعيد مستخدمة`],
  [/^Facility selected \(match score (\d+)\)$/, (m) => `تم اختيار المنشأة (درجة التوافق ${m[1]})`],
  [/^(.+): (yes|no)$/, (m) => `${phraseAr(m[1])}: ${m[2] === 'yes' ? 'نعم' : 'لا'}`],
];

function splitLabels(list: string): string[] {
  const known = Object.keys(SYMPTOM_BY_LABEL).sort((a, b) => b.length - a.length);
  const out: string[] = [];
  let rest = list;
  while (rest.length) {
    const hit = known.find((k) => rest.startsWith(k));
    if (!hit) return [...out, ...rest.split(', ')];
    out.push(hit);
    rest = rest.slice(hit.length).replace(/^, /, '');
  }
  return out;
}

function phraseAr(text: string): string {
  if (PHRASES_AR[text]) return PHRASES_AR[text];
  for (const [re, fn] of PATTERNS) {
    const m = text.match(re);
    if (m) return fn(m);
  }
  return text;
}

/** Translates English sentences generated by the triage/matching rules (kept in English for tests and stored records). */
export function phrase(text: string, lang: Lang): string {
  return lang === 'ar' ? phraseAr(text) : text;
}

export function screeningSummary(summary: string, lang: Lang): string {
  if (lang === 'en') return summary;
  const [reasons, answers = ''] = summary.split(/\.? ?Screening answers: /);
  const r = reasons.split('. ').filter(Boolean).map(phraseAr).join('. ');
  const a = answers === 'none' || !answers ? 'لا يوجد' : answers.split('; ').map(phraseAr).join('؛ ');
  return `${r}. إجابات الفحص: ${a}`;
}
