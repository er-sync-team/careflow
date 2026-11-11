import type { Hospital, LatLng, Pathway, Urgency } from './types';

/**
 * CareFlow matching algorithm (deterministic, transparent, testable).
 *   1. Safety rules are applied upstream (triage). Emergency pathway => no ranking at all.
 *   2. Mandatory eligibility filters exclude unsuitable facilities.
 *   3. Remaining facilities are ranked by a weighted score of normalized factors.
 * Weights only affect ranking among ELIGIBLE facilities, so a short wait can never
 * override a missing mandatory service or an availability constraint.
 */

export interface MatchWeights {
  travel: number;
  timeToCare: number;
  capacity: number;
  specialty: number;
  staffing: number;
}

export type RankedUrgency = Exclude<Urgency, 'emergency'>;

export const WEIGHT_PROFILES: Record<RankedUrgency, MatchWeights> = {
  high: { travel: 0.15, timeToCare: 0.45, capacity: 0.15, specialty: 0.2, staffing: 0.05 },
  moderate: { travel: 0.1, timeToCare: 0.45, capacity: 0.15, specialty: 0.2, staffing: 0.1 },
  low: { travel: 0.1, timeToCare: 0.45, capacity: 0.2, specialty: 0.15, staffing: 0.1 },
};

export const SCORING_CONSTANTS = {
  roadFactor: 1.35,
  avgSpeedKmh: 32,
  arrivalOverheadMin: 3,
  maxTravelMin: 60,
  maxTimeToCareMin: 240,
  fullStaffingDoctors: 10,
  limitedStatusMultiplier: 0.9,
};

export interface MatchRequest {
  urgency: Urgency;
  pathway: Pathway;
  specialty: string;
  origin: LatLng;
}

export interface ScoreFactor {
  key: keyof MatchWeights;
  label: string;
  weight: number;
  value: number;
  points: number;
}

export interface MatchResult {
  hospital: Hospital;
  distanceKm: number;
  etaMinutes: number;
  totalTimeMinutes: number;
  occupancyRatio: number;
  hasSpecialty: boolean;
  eligible: boolean;
  exclusionReasons: string[];
  score: number;
  factors: ScoreFactor[];
  reasons: string[];
}

export type MatchOutcome =
  | { mode: 'emergency'; ranked: []; excluded: [] }
  | { mode: 'ranked'; ranked: MatchResult[]; excluded: MatchResult[]; weights: MatchWeights };

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Simulated ETA: straight-line distance x road factor at an average urban speed. Not live traffic. */
export function simulatedEtaMinutes(distanceKm: number): number {
  const c = SCORING_CONSTANTS;
  return Math.round(((distanceKm * c.roadFactor) / c.avgSpeedKmh) * 60 + c.arrivalOverheadMin);
}

export function capacityLabel(ratio: number): 'Available' | 'Busy' | 'Near capacity' | 'Full' {
  if (ratio >= 1) return 'Full';
  if (ratio >= 0.85) return 'Near capacity';
  if (ratio >= 0.6) return 'Busy';
  return 'Available';
}

const isCount = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;

export function hasUsableData(h: Hospital): boolean {
  return (
    isCount(h.wait_minutes) &&
    isCount(h.current_occupancy) &&
    isCount(h.available_doctors) &&
    isCount(h.total_capacity) &&
    h.total_capacity > 0 &&
    Number.isFinite(h.lat) &&
    Number.isFinite(h.lng) &&
    Array.isArray(h.specialties)
  );
}

export function eligibilityIssues(h: Hospital, pathway: Pathway): string[] {
  if (!hasUsableData(h)) return ['Operational data unavailable, facility not ranked'];
  const issues: string[] = [];
  if (h.operational_status === 'closed') issues.push('Facility is currently closed');
  if (pathway === 'emergency_department') {
    if (!h.has_ed) issues.push('No emergency department');
    if (h.operational_status === 'diverting') issues.push('Emergency department is diverting new patients');
  }
  if (pathway === 'primary_care' && h.facility_type !== 'primary_care') {
    issues.push('Not a primary care facility (emergency departments are reserved for urgent cases)');
  }
  if (h.current_occupancy >= h.total_capacity) issues.push('No available capacity');
  return issues;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function scoreFacility(h: Hospital, req: MatchRequest, weights: MatchWeights) {
  const c = SCORING_CONSTANTS;
  const distanceKm = haversineKm(req.origin, { lat: h.lat, lng: h.lng });
  const etaMinutes = simulatedEtaMinutes(distanceKm);
  const occupancyRatio = h.total_capacity > 0 ? h.current_occupancy / h.total_capacity : 1;
  const hasSpecialty = !req.specialty || (Array.isArray(h.specialties) && h.specialties.includes(req.specialty));

  const values: Record<keyof MatchWeights, number> = {
    travel: clamp01(1 - etaMinutes / c.maxTravelMin),
    timeToCare: clamp01(1 - (etaMinutes + h.wait_minutes) / c.maxTimeToCareMin),
    capacity: clamp01(1 - occupancyRatio),
    specialty: hasSpecialty ? 1 : 0,
    staffing: clamp01(h.available_doctors / c.fullStaffingDoctors),
  };
  const labels: Record<keyof MatchWeights, string> = {
    travel: 'Travel time',
    timeToCare: 'Time until care (travel + wait)',
    capacity: 'Free capacity',
    specialty: 'Relevant specialty',
    staffing: 'Doctors on duty',
  };
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const multiplier = h.operational_status === 'limited' ? c.limitedStatusMultiplier : 1;
  const factors: ScoreFactor[] = (Object.keys(values) as (keyof MatchWeights)[]).map((key) => ({
    key,
    label: labels[key],
    weight: weights[key] / totalWeight,
    value: values[key],
    points: ((weights[key] / totalWeight) * values[key] * 100) * multiplier,
  }));
  const raw = factors.reduce((a, f) => a + f.points, 0);
  const score = Number.isFinite(raw) ? Math.round(raw) : 0;
  return { distanceKm, etaMinutes, occupancyRatio, hasSpecialty, factors, score, multiplier };
}

function explain(r: Omit<MatchResult, 'reasons'>, req: MatchRequest, specialtyLabel: (id: string) => string): string[] {
  const reasons: string[] = [];
  const h = r.hospital;
  if (req.pathway === 'emergency_department') reasons.push('Emergency department open and accepting patients');
  else reasons.push('Primary care facility suitable for non-urgent care');
  if (req.specialty) {
    reasons.push(r.hasSpecialty ? `Offers ${specialtyLabel(req.specialty)}` : `Does not list ${specialtyLabel(req.specialty)}, general care available`);
  }
  reasons.push(`About ${r.etaMinutes} min away (simulated) and ~${h.wait_minutes} min estimated wait`);
  reasons.push(`${capacityLabel(r.occupancyRatio)}: ${h.current_occupancy}/${h.total_capacity} beds or slots in use`);
  if (h.operational_status === 'limited') reasons.push('Operating with limited services (score reduced 10%)');
  return reasons;
}

export function matchFacilities(
  hospitals: Hospital[],
  req: MatchRequest,
  options: { weights?: MatchWeights; specialtyLabel?: (id: string) => string } = {},
): MatchOutcome {
  if (req.urgency === 'emergency' || req.pathway === 'emergency_assistance') {
    return { mode: 'emergency', ranked: [], excluded: [] };
  }
  const weights = options.weights ?? WEIGHT_PROFILES[req.urgency];
  const specialtyLabel = options.specialtyLabel ?? ((id: string) => id);

  const results: MatchResult[] = hospitals.map((h) => {
    const issues = eligibilityIssues(h, req.pathway);
    const s = scoreFacility(h, req, weights);
    const base = {
      hospital: h,
      distanceKm: s.distanceKm,
      etaMinutes: s.etaMinutes,
      totalTimeMinutes: s.etaMinutes + h.wait_minutes,
      occupancyRatio: s.occupancyRatio,
      hasSpecialty: s.hasSpecialty,
      eligible: issues.length === 0,
      exclusionReasons: issues,
      score: issues.length === 0 ? s.score : 0,
      factors: s.factors,
    };
    return { ...base, reasons: issues.length === 0 ? explain(base, req, specialtyLabel) : issues };
  });

  const ranked = results
    .filter((r) => r.eligible)
    .sort((a, b) => b.score - a.score || a.etaMinutes - b.etaMinutes || a.hospital.id.localeCompare(b.hospital.id));
  const excluded = results.filter((r) => !r.eligible);
  return { mode: 'ranked', ranked, excluded, weights };
}

export interface TimeSaved {
  best: MatchResult;
  nearest: MatchResult;
  savedMinutes: number;
}

/**
 * Compares the recommended facility with the nearest suitable one (by distance).
 * Returns null when the nearest suitable facility is already the recommendation or saves no time.
 */
export function timeSavedVsNearest(ranked: MatchResult[]): TimeSaved | null {
  if (ranked.length < 2) return null;
  const best = ranked[0];
  const nearest = ranked.reduce((a, b) => (b.distanceKm < a.distanceKm ? b : a));
  if (nearest.hospital.id === best.hospital.id) return null;
  const savedMinutes = Math.round(nearest.totalTimeMinutes - best.totalTimeMinutes);
  return savedMinutes > 0 ? { best, nearest, savedMinutes } : null;
}
