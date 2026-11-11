export type Urgency = 'low' | 'moderate' | 'high' | 'emergency';
export type Pathway = 'emergency_assistance' | 'emergency_department' | 'primary_care';
export type Severity = 'mild' | 'moderate' | 'severe';
export type Onset = 'hour' | 'today' | 'days' | 'week';
export type Sex = 'male' | 'female' | 'unspecified';
export type OperationalStatus = 'open' | 'limited' | 'diverting' | 'closed';
export type FacilityType = 'hospital' | 'primary_care';
export type CaseStatus = 'incoming' | 'arrived' | 'in_treatment' | 'discharged' | 'redirected';

export interface Hospital {
  id: string;
  name: string;
  district: string;
  name_ar: string;
  district_ar: string;
  lat: number;
  lng: number;
  facility_type: FacilityType;
  has_ed: boolean;
  specialties: string[];
  available_doctors: number;
  total_capacity: number;
  current_occupancy: number;
  wait_minutes: number;
  treatment_minutes: number;
  operational_status: OperationalStatus;
  updated_at: string;
}

export interface TimelineEvent {
  status: string;
  at: string;
  note: string;
}

export interface CareCase {
  id: string;
  created_at: string;
  updated_at: string;
  patient_alias: string;
  age: number;
  sex: Sex;
  symptoms: string[];
  description: string;
  severity: Severity;
  onset: Onset;
  history: string[];
  red_flags: string[];
  urgency: Urgency;
  pathway: Pathway;
  specialty: string;
  screening_summary: string;
  hospital_id: string;
  distance_km: number | null;
  eta_minutes: number | null;
  match_score: number | null;
  status: CaseStatus;
  timeline: TimelineEvent[];
  is_synthetic: boolean;
}

export interface LatLng {
  lat: number;
  lng: number;
}
