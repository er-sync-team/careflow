/*
# Allow anonymous patients to submit incoming cases

1. Purpose
- Patients use CareFlow without signing in (anon role). The previous privilege tightening left INSERT on `cases` only for `authenticated`, so patient case submission failed.

2. Security
- Grants column-limited INSERT on `cases` to `anon` (same patient columns as `authenticated`).
- `status`, `is_synthetic`, `id`, `created_at` remain non-insertable; the existing policy still forces status = 'incoming' and is_synthetic = false.
- anon still cannot read, update or delete cases.
*/

GRANT INSERT (patient_alias, age, sex, symptoms, description, severity, onset, history, red_flags, urgency, pathway,
  specialty, screening_summary, hospital_id, distance_km, eta_minutes, match_score, timeline)
ON cases TO anon;
