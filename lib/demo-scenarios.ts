import type { TriageInput } from './triage/engine';
import type { Lang } from './i18n/config';

export type DemoScenarioId = 'emergency' | 'matching';

export interface DemoScenario {
  id: DemoScenarioId;
  title: string;
  summary: string;
  ar: { title: string; summary: string; description: string };
  answers: TriageInput & { description: string; locationId: string };
}

export const DEMO_SCENARIOS: Record<DemoScenarioId, DemoScenario> = {
  emergency: {
    id: 'emergency',
    title: 'Scenario A - Emergency warning',
    summary: 'A 58-year-old reports severe chest pain that started 20 minutes ago.',
    ar: { title: 'السيناريو أ - تحذير طارئ', summary: 'مريض عمره 58 عاما يبلغ عن ألم شديد في الصدر بدأ قبل 20 دقيقة.', description: 'ألم ضاغط وشديد في الصدر بدأ قبل حوالي 20 دقيقة' },
    answers: {
      age: 58,
      sex: 'male',
      symptoms: ['chest_pain'],
      description: 'Severe crushing chest pain that started about 20 minutes ago',
      severity: 'severe',
      onset: 'hour',
      history: [],
      screening: {},
      locationId: 'rawdah',
    },
  },
  matching: {
    id: 'matching',
    title: 'Scenario B - Facility matching',
    summary: 'A stable 34-year-old with fever and cough for two days, no warning signs.',
    ar: { title: 'السيناريو ب - مطابقة المنشآت', summary: 'مريضة مستقرة عمرها 34 عاما تعاني من حمى وسعال منذ يومين، دون علامات تحذيرية.', description: '' },
    answers: {
      age: 34,
      sex: 'female',
      symptoms: ['high_fever', 'cough'],
      description: '',
      severity: 'moderate',
      onset: 'days',
      history: [],
      screening: {},
      locationId: 'rawdah',
    },
  },
};

/** Facilities placed 5 km, 9 km and 7 km from the Scenario B patient for the dynamic matching demo. */
export const DEMO_FACILITY_LETTERS: Record<string, string> = { H08: 'A', H06: 'B', H07: 'C' };

const AR_LETTERS: Record<string, string> = { A: 'أ', B: 'ب', C: 'ج' };

export function scenarioText(s: DemoScenario, lang: Lang) {
  return lang === 'ar' ? s.ar : { title: s.title, summary: s.summary };
}

export function demoLetter(hospitalId: string, lang: Lang): string | null {
  const l = DEMO_FACILITY_LETTERS[hospitalId];
  if (!l) return null;
  return lang === 'ar' ? AR_LETTERS[l] : l;
}

export function demoHospitalLabel(hospitalId: string, lang: Lang): string | null {
  const l = demoLetter(hospitalId, lang);
  if (!l) return null;
  return lang === 'ar' ? `المستشفى ${l}` : `Hospital ${l}`;
}

export const DEMO_ADMIN_PASSWORD = 'CareFlowDemo2026!';
export const demoAdminEmail = (hospitalId: string) => `admin.${hospitalId.toLowerCase()}@careflow-demo.test`;
