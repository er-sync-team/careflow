import type { MatchResult } from './matching';
import type { TriageInput, TriageResult } from './triage/engine';
import { SCREENING_QUESTIONS } from './triage/catalog.ts';

export interface CaseDraft extends TriageInput {
  description: string;
}

export function makeAlias(random: () => number = Math.random) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += chars[Math.floor(random() * chars.length)];
  return `Patient #${s}`;
}

/** Builds the synthetic incoming-case row sent to the chosen facility. Emergency cases are never routed. */
export function buildIncomingCase(draft: CaseDraft, triage: TriageResult, match: MatchResult, alias: string, now = new Date()) {
  if (triage.urgency === 'emergency' || triage.pathway === 'emergency_assistance') {
    throw new Error('Emergency cases must call 997 and are not routed to a facility');
  }
  if (!match.eligible) throw new Error('Cannot route a case to an ineligible facility');

  const at = now.toISOString();
  const answered = SCREENING_QUESTIONS.filter((q) => q.id in draft.screening)
    .map((q) => `${q.yesFlag}: ${draft.screening[q.id] ? 'yes' : 'no'}`)
    .join('; ');

  return {
    patient_alias: alias.slice(0, 40),
    age: Math.max(0, Math.min(120, Math.round(draft.age))),
    sex: draft.sex,
    symptoms: draft.symptoms,
    description: draft.description.slice(0, 1000),
    severity: draft.severity,
    onset: draft.onset,
    history: draft.history,
    red_flags: [] as string[],
    urgency: triage.urgency,
    pathway: triage.pathway,
    specialty: triage.specialty,
    screening_summary: `${triage.reasons.join('. ')}. Screening answers: ${answered || 'none'}`.slice(0, 2000),
    hospital_id: match.hospital.id,
    distance_km: Math.round(match.distanceKm * 100) / 100,
    eta_minutes: match.etaMinutes,
    match_score: Math.max(0, Math.min(100, match.score)),
    timeline: [
      { status: 'assessed', at, note: 'Initial screening completed' },
      { status: 'incoming', at, note: `Facility selected (match score ${match.score})` },
    ],
  };
}
