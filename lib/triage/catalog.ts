import type { Urgency } from '../types';

export interface SymptomDef {
  id: string;
  label: string;
  patterns: RegExp[];
  immediateFlag?: string;
}

export const SYMPTOMS: SymptomDef[] = [
  { id: 'chest_pain', label: 'Chest pain or pressure', patterns: [/chest (pain|pressure|tight)/, /pain in (my )?chest/, /heart pain/, /crushing/] },
  { id: 'shortness_of_breath', label: 'Difficulty breathing', patterns: [/breath/, /wheez/, /suffocat/, /can'?t breathe/, /cannot breathe/] },
  {
    id: 'stroke_signs',
    label: 'Face drooping, arm weakness or slurred speech',
    patterns: [/face (is )?droop/, /slurred/, /(weak|numb)(ness)? (on )?one side/, /one side of (my|the) (body|face)/, /\bstroke\b/, /can'?t (speak|talk)/],
    immediateFlag: 'Possible stroke signs (face, arm or speech changes)',
  },
  {
    id: 'unconscious',
    label: 'Fainting or loss of consciousness',
    patterns: [/faint/, /passed out/, /unconscious/, /collapsed/, /unresponsive/, /black(ed)? ?out/],
    immediateFlag: 'Loss of consciousness or fainting',
  },
  { id: 'seizure', label: 'Seizure or convulsions', patterns: [/seizure/, /convuls/, /\bfit\b/], immediateFlag: 'Seizure or convulsions' },
  {
    id: 'severe_bleeding',
    label: "Heavy bleeding that won't stop",
    patterns: [/bleeding (heavily|a lot)/, /heavy bleeding/, /won'?t stop bleeding/, /blood everywhere/],
    immediateFlag: 'Heavy, uncontrolled bleeding',
  },
  {
    id: 'poisoning',
    label: 'Poisoning or overdose',
    patterns: [/overdos/, /too many (pills|tablets|meds|medicines)/, /poison/, /swallowed (bleach|chemical|detergent|cleaner|battery)/],
    immediateFlag: 'Possible poisoning or overdose',
  },
  { id: 'severe_headache', label: 'Severe headache', patterns: [/headache/, /migraine/, /head pain/] },
  { id: 'abdominal_pain', label: 'Abdominal pain', patterns: [/stomach/, /abdom/, /belly/, /tummy/] },
  { id: 'high_fever', label: 'Fever', patterns: [/fever/, /temperature/, /chills/] },
  { id: 'injury', label: 'Injury, fall or possible fracture', patterns: [/\bfell\b/, /\bfall\b/, /fractur/, /broke/, /sprain/, /twist/, /injur/, /accident/] },
  { id: 'burn', label: 'Burn', patterns: [/\bburn(ed|t)?\b/, /scald/] },
  { id: 'allergic_reaction', label: 'Allergic reaction or swelling', patterns: [/allerg/, /swollen (lips|tongue|face)/, /hives/, /anaphyla/] },
  { id: 'vomiting', label: 'Vomiting or diarrhea', patterns: [/vomit/, /throwing up/, /diarrh/, /nause/] },
  { id: 'dizziness', label: 'Dizziness', patterns: [/dizz/, /light-?headed/, /vertigo/] },
  { id: 'cough', label: 'Cough or cold symptoms', patterns: [/cough/, /\bcold\b/, /runny nose/, /congest/, /\bflu\b/] },
  { id: 'sore_throat', label: 'Sore throat', patterns: [/sore throat/, /throat pain/, /hurts to swallow/] },
  { id: 'ear_pain', label: 'Ear pain', patterns: [/\bears?\b/, /earache/] },
  { id: 'rash', label: 'Skin rash or itching', patterns: [/rash/, /itch/, /\bspots\b/] },
  { id: 'urinary_pain', label: 'Painful urination', patterns: [/urinat/, /\bpee\b/, /burning when/, /bladder/] },
  { id: 'back_pain', label: 'Back or joint pain', patterns: [/back pain/, /joint/, /knee/, /shoulder/] },
];

export const SYMPTOM_LABELS: Record<string, string> = Object.fromEntries(SYMPTOMS.map((s) => [s.id, s.label]));

export const HISTORY_OPTIONS = [
  { id: 'heart_disease', label: 'Heart disease' },
  { id: 'hypertension', label: 'High blood pressure' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'asthma', label: 'Asthma or lung disease' },
  { id: 'pregnancy', label: 'Currently pregnant' },
  { id: 'immunocompromised', label: 'Weakened immune system' },
  { id: 'blood_thinners', label: 'Taking blood thinners' },
];

export const HISTORY_LABELS: Record<string, string> = Object.fromEntries(HISTORY_OPTIONS.map((h) => [h.id, h.label]));

export const SEVERITY_OPTIONS = [
  { id: 'mild', label: 'Mild', hint: 'Noticeable, but I can do my normal activities' },
  { id: 'moderate', label: 'Moderate', hint: 'It is affecting what I can do today' },
  { id: 'severe', label: 'Severe', hint: 'Very intense, hard to do anything' },
] as const;

export const ONSET_OPTIONS = [
  { id: 'hour', label: 'Within the last hour' },
  { id: 'today', label: 'Earlier today' },
  { id: 'days', label: '1 to 3 days ago' },
  { id: 'week', label: 'More than 3 days ago' },
] as const;

export interface ScreeningQuestion {
  id: string;
  text: string;
  appliesTo: (symptoms: string[], history: string[]) => boolean;
  yesLevel: Extract<Urgency, 'high' | 'emergency'>;
  yesFlag: string;
}

const has = (list: string[], ...ids: string[]) => ids.some((id) => list.includes(id));

export const SCREENING_QUESTIONS: ScreeningQuestion[] = [
  {
    id: 'chest_radiating',
    text: 'Is the chest pain spreading to your arm, jaw, neck or back, or does it come with sweating, nausea or breathlessness?',
    appliesTo: (s) => has(s, 'chest_pain'),
    yesLevel: 'emergency',
    yesFlag: 'Chest pain with spreading pain or associated symptoms',
  },
  {
    id: 'breath_severe',
    text: 'Are you unable to speak in full sentences, or are your lips or face turning blue or grey?',
    appliesTo: (s) => has(s, 'shortness_of_breath'),
    yesLevel: 'emergency',
    yesFlag: 'Severe breathing difficulty',
  },
  {
    id: 'allergy_airway',
    text: 'Is there swelling of the lips, tongue or throat, or any difficulty breathing or swallowing?',
    appliesTo: (s) => has(s, 'allergic_reaction'),
    yesLevel: 'emergency',
    yesFlag: 'Allergic reaction affecting the airway',
  },
  {
    id: 'headache_thunderclap',
    text: 'Did the headache start suddenly and feel like the worst of your life, or come with confusion, weakness or vision loss?',
    appliesTo: (s) => has(s, 'severe_headache'),
    yesLevel: 'emergency',
    yesFlag: 'Sudden, severe headache with warning features',
  },
  {
    id: 'fever_meningitis',
    text: 'Do you have a stiff neck, confusion, or a rash that does not fade when pressed?',
    appliesTo: (s) => has(s, 'high_fever'),
    yesLevel: 'emergency',
    yesFlag: 'Fever with stiff neck, confusion or non-fading rash',
  },
  {
    id: 'abdominal_red',
    text: 'Are you vomiting blood, passing black stools, or is your abdomen hard and extremely tender?',
    appliesTo: (s) => has(s, 'abdominal_pain', 'vomiting'),
    yesLevel: 'emergency',
    yesFlag: 'Abdominal symptoms with possible internal bleeding',
  },
  {
    id: 'pregnancy_bleeding',
    text: 'Are you experiencing vaginal bleeding, fluid leakage or reduced baby movements?',
    appliesTo: (s, h) => h.includes('pregnancy') && has(s, 'abdominal_pain', 'vomiting', 'dizziness', 'severe_headache'),
    yesLevel: 'high',
    yesFlag: 'Pregnancy-related warning sign',
  },
  {
    id: 'injury_deformity',
    text: 'Is there an obvious deformity, are you unable to move or put weight on the injured part, or did you hit your head?',
    appliesTo: (s) => has(s, 'injury'),
    yesLevel: 'high',
    yesFlag: 'Injury with possible fracture or head impact',
  },
  {
    id: 'burn_large',
    text: 'Is the burn larger than the palm of your hand, or on the face, hands, groin or a joint?',
    appliesTo: (s) => has(s, 'burn'),
    yesLevel: 'high',
    yesFlag: 'Large or sensitive-area burn',
  },
  {
    id: 'dehydration',
    text: 'Have you been unable to keep any fluids down for over 12 hours, or are you passing very little urine?',
    appliesTo: (s) => has(s, 'vomiting'),
    yesLevel: 'high',
    yesFlag: 'Possible dehydration',
  },
  {
    id: 'rapid_worsening',
    text: 'Are your symptoms getting rapidly worse right now?',
    appliesTo: () => true,
    yesLevel: 'high',
    yesFlag: 'Rapidly worsening symptoms',
  },
];

// Arabic keywords, matched against text normalized by normalizeArabic (no diacritics, unified alef/ya/ta marbuta).
const near = (a: string, b: string) => new RegExp(`(${a})[^.،,؛]{0,25}(${b})`);
const PAIN = 'الم|وجع|اوجاع|مغص';

const ARABIC_PATTERNS: Record<string, RegExp[]> = {
  chest_pain: [near(`${PAIN}|ضيق|ضغط|ثقل`, 'صدر'), near(PAIN, 'قلب')],
  shortness_of_breath: [near('ضيق|صعوبه', 'تنفس|نفس'), /اختناق/, /لا استطيع (ال)?تنفس/, /ما اقدر اتنفس/, /كتمه/],
  stroke_signs: [/جلطه/, /سكته/, /تدلي (في )?(ال)?وجه/, /ثقل (في )?(ال)?لسان/, /تلعثم/, /(ضعف|خدر|تنميل) (في )?(جهه|جانب) واحد/, /شلل/],
  unconscious: [/اغماء/, /اغمي/, /فقدان (ال)?وعي/, /فقد (ال)?وعي/, /غائب عن (ال)?وعي/, /سقط مغشيا/, /طاح وما يرد/],
  seizure: [/تشنج/, /نوبه صرع/, /\bصرع\b/],
  poisoning: [/تسمم/, /جرعه (زائده|زايده|كبيره)/, /(اخذ|اخذت|بلع|بلعت|شرب|شربت) (حبوب|ادويه|دواء) (كثير|كثيره|زياده)/, /(بلع|بلعت|شرب|شربت) (كلوركس|منظف|مبيض|ماده كيميائيه|بطاريه)/],
  severe_bleeding: [/نزيف (شديد|حاد|قوي|ما يوقف|لا يتوقف)/, /ينزف (بشده|كثير|بكثره)/, /دم كثير/],
  severe_headache: [/صداع/, near(PAIN, 'راس'), /شقيقه/],
  abdominal_pain: [near(PAIN, 'بطن|معده'), /مغص/],
  high_fever: [/حمي/, /حراره/, /سخونه/, /قشعريره/],
  injury: [/سقطت/, /طحت/, /سقوط/, /كسر/, /مكسور/, /التواء/, /التوي/, /لويت/, /اصابه/, /حادث/, /رضوض/],
  burn: [/(^|[^ا-ي])حرق(?!ه|ان)/, /حروق/, /انحرق/, /احترق/],
  allergic_reaction: [/حساسيه/, near('تورم|انتفاخ', 'شفاه|شفايف|لسان|وجه'), /طفح تحسسي/, /ارتكاريا/],
  vomiting: [/استفراغ/, /ترجيع/, /قيء/, /تقيؤ/, /اسهال/, /غثيان/],
  dizziness: [/دوخه/, /دوار/, /دايخ/],
  cough: [/كحه/, /سعال/, /زكام/, /رشح/, /انفلونزا/, /برد/],
  sore_throat: [near(`${PAIN}|التهاب`, 'حلق|زور'), /بلعوم/, near(`${PAIN}|صعوبه`, 'بلع')],
  ear_pain: [/اذن/, /اذني/],
  rash: [/طفح/, /حكه/, /هرش/, /بقع (في|على) (ال)?جلد/],
  urinary_pain: [near(`${PAIN}|حرقه|حرقان`, 'تبول|بول'), /مثانه/, /مسالك/],
  back_pain: [near(PAIN, 'ظهر'), /مفصل/, /مفاصل/, /ركبه/, /كتف/],
};

export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و');
}

export function extractSymptomsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const arabic = normalizeArabic(lower);
  return SYMPTOMS.filter((s) => s.patterns.some((p) => p.test(lower)) || (ARABIC_PATTERNS[s.id] ?? []).some((p) => p.test(arabic))).map(
    (s) => s.id,
  );
}

export const SPECIALTY_LABELS: Record<string, string> = {
  emergency_medicine: 'Emergency Medicine',
  cardiology: 'Cardiology',
  neurology: 'Neurology',
  orthopedics: 'Orthopedics',
  pediatrics: 'Pediatrics',
  obstetrics: 'Obstetrics & Gynecology',
  general_surgery: 'General Surgery',
  internal_medicine: 'Internal Medicine',
  pulmonology: 'Pulmonology',
  family_medicine: 'Family Medicine',
  dermatology: 'Dermatology',
  ent: 'Ear, Nose & Throat',
};
