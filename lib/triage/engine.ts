import type { Onset, Pathway, Severity, Sex, Urgency } from '../types';
import { SCREENING_QUESTIONS, SYMPTOMS, SYMPTOM_LABELS } from './catalog.ts';

export interface TriageInput {
  age: number;
  sex: Sex;
  symptoms: string[];
  severity: Severity;
  onset: Onset;
  history: string[];
  screening: Record<string, boolean>;
}

export interface TriageResult {
  urgency: Urgency;
  pathway: Pathway;
  specialty: string;
  redFlags: string[];
  reasons: string[];
}

const LEVELS: Urgency[] = ['low', 'moderate', 'high', 'emergency'];
const rank = (u: Urgency) => LEVELS.indexOf(u);
const maxLevel = (a: Urgency, b: Urgency) => (rank(a) >= rank(b) ? a : b);
const bump = (u: Urgency): Urgency => (u === 'low' ? 'moderate' : u === 'moderate' ? 'high' : u);

const BASE_LEVEL: Record<string, Urgency> = {
  chest_pain: 'high',
  shortness_of_breath: 'moderate',
  severe_headache: 'moderate',
  abdominal_pain: 'moderate',
  high_fever: 'moderate',
  injury: 'moderate',
  burn: 'moderate',
  allergic_reaction: 'moderate',
  vomiting: 'low',
  dizziness: 'moderate',
  cough: 'low',
  sore_throat: 'low',
  ear_pain: 'low',
  rash: 'low',
  urinary_pain: 'low',
  back_pain: 'low',
};

const MINOR = new Set(['cough', 'sore_throat', 'ear_pain', 'rash', 'urinary_pain', 'back_pain']);
const NEEDS_ED_SERVICES = new Set(['injury', 'burn']);

/** Deterministic red-flag detection. Runs first and cannot be overridden by any other rule. */
export function detectRedFlags(input: Pick<TriageInput, 'symptoms' | 'severity' | 'onset' | 'screening' | 'history'>): string[] {
  const flags: string[] = [];
  for (const s of SYMPTOMS) {
    if (s.immediateFlag && input.symptoms.includes(s.id)) flags.push(s.immediateFlag);
  }
  if (input.severity === 'severe') {
    if (input.symptoms.includes('chest_pain')) flags.push('Severe chest pain');
    if (input.symptoms.includes('shortness_of_breath')) flags.push('Severe breathing difficulty');
    if (input.symptoms.includes('severe_headache') && input.onset === 'hour') flags.push('Sudden severe headache');
  }
  for (const q of SCREENING_QUESTIONS) {
    if (q.yesLevel === 'emergency' && input.screening[q.id] === true) flags.push(q.yesFlag);
  }
  return Array.from(new Set(flags));
}

export function screeningQuestionsFor(symptoms: string[], history: string[]) {
  return SCREENING_QUESTIONS.filter((q) => q.appliesTo(symptoms, history));
}

function pickSpecialty(input: TriageInput, pathway: Pathway): string {
  const s = input.symptoms;
  if (pathway === 'primary_care') {
    if (input.age < 14) return 'pediatrics';
    if (s.includes('rash')) return 'dermatology';
    if (s.includes('ear_pain') || s.includes('sore_throat')) return 'ent';
    return 'family_medicine';
  }
  if (input.history.includes('pregnancy') && (s.includes('abdominal_pain') || s.includes('vomiting'))) return 'obstetrics';
  if (input.age < 14) return 'pediatrics';
  if (s.includes('chest_pain')) return 'cardiology';
  if (s.includes('injury')) return 'orthopedics';
  if (s.includes('severe_headache') || s.includes('dizziness')) return 'neurology';
  if (s.includes('shortness_of_breath')) return 'pulmonology';
  if (s.includes('abdominal_pain') && input.severity === 'severe') return 'general_surgery';
  return 'internal_medicine';
}

export function evaluateTriage(input: TriageInput): TriageResult {
  const redFlags = detectRedFlags(input);
  if (redFlags.length > 0) {
    return {
      urgency: 'emergency',
      pathway: 'emergency_assistance',
      specialty: 'emergency_medicine',
      redFlags,
      reasons: redFlags.map((f) => `Warning sign reported: ${f}`),
    };
  }

  const reasons: string[] = [];
  let urgency: Urgency = 'low';
  for (const s of input.symptoms) {
    const base = BASE_LEVEL[s] ?? 'low';
    const level = input.severity === 'severe' ? bump(base) : base;
    if (rank(level) > rank(urgency)) urgency = level;
  }
  if (input.symptoms.length > 0) {
    reasons.push(`Reported: ${input.symptoms.map((s) => SYMPTOM_LABELS[s] ?? s).join(', ')} (${input.severity})`);
  }
  if (input.severity === 'severe') reasons.push('Severe symptom intensity raises the priority by one level');

  const significant = input.symptoms.some((s) => !MINOR.has(s));
  if ((input.age >= 65 || input.age < 1) && significant) {
    urgency = bump(urgency);
    reasons.push(input.age < 1 ? 'Infants under 1 year are prioritized' : 'Age 65 or older raises the priority');
  }
  if (input.history.includes('heart_disease') && input.symptoms.some((s) => ['chest_pain', 'shortness_of_breath', 'dizziness'].includes(s))) {
    urgency = maxLevel(urgency, 'high');
    reasons.push('Known heart disease with cardiac-type symptoms');
  }
  if (input.history.includes('immunocompromised') && input.symptoms.includes('high_fever')) {
    urgency = maxLevel(urgency, 'high');
    reasons.push('Fever with a weakened immune system');
  }
  for (const q of SCREENING_QUESTIONS) {
    if (q.yesLevel === 'high' && input.screening[q.id] === true) {
      urgency = maxLevel(urgency, 'high');
      reasons.push(q.yesFlag);
    }
  }

  let pathway: Pathway;
  if (urgency === 'high') {
    pathway = 'emergency_department';
    reasons.push('High priority: an emergency department can assess you promptly');
  } else if (urgency === 'moderate' && input.symptoms.some((s) => NEEDS_ED_SERVICES.has(s))) {
    pathway = 'emergency_department';
    reasons.push('Injuries and burns may need imaging or procedures available in an emergency department');
  } else {
    pathway = 'primary_care';
    reasons.push(
      urgency === 'moderate'
        ? 'No warning signs found: a same-day primary care visit is suggested'
        : 'No warning signs found: a primary care center or clinic is suitable',
    );
  }

  return { urgency, pathway, specialty: pickSpecialty(input, pathway), redFlags: [], reasons };
}

export const URGENCY_META: Record<Urgency, { label: string; tone: string; dot: string }> = {
  low: { label: 'Low Urgency', tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  moderate: { label: 'Moderate', tone: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  high: { label: 'High Priority', tone: 'bg-orange-50 text-orange-800 ring-orange-200', dot: 'bg-orange-500' },
  emergency: { label: 'Emergency', tone: 'bg-red-50 text-red-800 ring-red-200', dot: 'bg-red-600' },
};

export const PATHWAY_META: Record<Pathway, { label: string; short: string }> = {
  emergency_assistance: { label: 'Emergency Assistance', short: 'Call 997 now' },
  emergency_department: { label: 'Emergency Department Assessment', short: 'Visit an emergency department' },
  primary_care: { label: 'Primary Care', short: 'Visit a primary care center' },
};
