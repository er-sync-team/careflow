/*
# CareFlow core schema (synthetic demo data)

Creates the storage for the CareFlow Smart Emergency Routing demo.

1. New Tables
- `hospitals` - fictional demonstration facilities around Jeddah. ALL operational values are synthetic.
  - `id` (text, pk, e.g. H01), `name`, `district`, `lat`, `lng`
  - `facility_type` (hospital | primary_care)
  - `has_ed` (emergency department available)
  - `specialties` (text[]), `available_doctors`, `total_capacity`, `current_occupancy`
  - `wait_minutes` (estimated waiting time), `treatment_minutes` (estimated treatment time)
  - `operational_status` (open | limited | diverting | closed)
  - `updated_at` (auto-set on every update)
- `hospital_admins` - links a signed-in administrator to exactly ONE facility.
  - `user_id` (pk, references auth.users), `hospital_id`, `created_at`
- `cases` - patient assessment summaries sent to a facility (synthetic seeded + demo submissions).
  - patient alias, age, sex, symptoms, severity, onset, history, red flags, urgency, pathway,
    specialty, selected hospital, distance, ETA, match score, status, timeline (jsonb), is_synthetic

2. Security
- RLS enabled on all tables.
- `hospitals`: anyone (anon + authenticated) may read (public directory of demo facilities).
  Only an assigned administrator may update their own facility, and only operational columns.
- `hospital_admins`: a signed-in user can read only their own assignment. Assignment is created
  only through `claim_demo_facility()` which allows one facility per account, never changeable.
- `cases`: anyone may submit a new case (status must be 'incoming', cannot mark synthetic).
  Only the administrator of the destination facility may read or update its cases
  (update limited to status + timeline columns).

3. Important Notes
  1. No real patient or hospital data. Every facility is fictional.
  2. `hospitals` and `cases` are added to realtime so rankings and dashboards update live.
*/

CREATE TABLE IF NOT EXISTS hospitals (
  id text PRIMARY KEY,
  name text NOT NULL,
  district text NOT NULL DEFAULT '',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  facility_type text NOT NULL CHECK (facility_type IN ('hospital','primary_care')),
  has_ed boolean NOT NULL DEFAULT false,
  specialties text[] NOT NULL DEFAULT '{}',
  available_doctors integer NOT NULL DEFAULT 0 CHECK (available_doctors >= 0 AND available_doctors <= 500),
  total_capacity integer NOT NULL CHECK (total_capacity > 0 AND total_capacity <= 2000),
  current_occupancy integer NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0 AND current_occupancy <= 4000),
  wait_minutes integer NOT NULL DEFAULT 0 CHECK (wait_minutes >= 0 AND wait_minutes <= 1440),
  treatment_minutes integer NOT NULL DEFAULT 30 CHECK (treatment_minutes >= 0 AND treatment_minutes <= 1440),
  operational_status text NOT NULL DEFAULT 'open' CHECK (operational_status IN ('open','limited','diverting','closed')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hospital_admins (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id text NOT NULL REFERENCES hospitals(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hospital_admins_hospital_idx ON hospital_admins(hospital_id);

CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  patient_alias text NOT NULL CHECK (char_length(patient_alias) <= 40),
  age integer NOT NULL CHECK (age >= 0 AND age <= 120),
  sex text NOT NULL DEFAULT 'unspecified' CHECK (sex IN ('male','female','unspecified')),
  symptoms text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  severity text NOT NULL CHECK (severity IN ('mild','moderate','severe')),
  onset text NOT NULL CHECK (onset IN ('hour','today','days','week')),
  history text[] NOT NULL DEFAULT '{}',
  red_flags text[] NOT NULL DEFAULT '{}',
  urgency text NOT NULL CHECK (urgency IN ('low','moderate','high','emergency')),
  pathway text NOT NULL CHECK (pathway IN ('emergency_assistance','emergency_department','primary_care')),
  specialty text NOT NULL DEFAULT '',
  screening_summary text NOT NULL DEFAULT '' CHECK (char_length(screening_summary) <= 2000),
  hospital_id text NOT NULL REFERENCES hospitals(id),
  distance_km numeric(6,2),
  eta_minutes integer,
  match_score integer CHECK (match_score >= 0 AND match_score <= 100),
  status text NOT NULL DEFAULT 'incoming' CHECK (status IN ('incoming','arrived','in_treatment','discharged','redirected')),
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_synthetic boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS cases_hospital_created_idx ON cases(hospital_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION set_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS hospitals_set_updated_at ON hospitals;
CREATE TRIGGER hospitals_set_updated_at BEFORE UPDATE ON hospitals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS cases_set_updated_at ON cases;
CREATE TRIGGER cases_set_updated_at BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON hospitals TO anon, authenticated;
GRANT UPDATE (specialties, available_doctors, total_capacity, current_occupancy, wait_minutes, treatment_minutes, operational_status) ON hospitals TO authenticated;
GRANT SELECT ON hospital_admins TO authenticated;
GRANT INSERT (patient_alias, age, sex, symptoms, description, severity, onset, history, red_flags, urgency, pathway, specialty, screening_summary, hospital_id, distance_km, eta_minutes, match_score, timeline) ON cases TO anon, authenticated;
GRANT SELECT ON cases TO authenticated;
GRANT UPDATE (status, timeline) ON cases TO authenticated;

-- hospitals: public directory of fictional facilities
DROP POLICY IF EXISTS "Anyone can view demo facilities" ON hospitals;
CREATE POLICY "Anyone can view demo facilities" ON hospitals FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins update own facility" ON hospitals;
CREATE POLICY "Admins update own facility" ON hospitals FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM hospital_admins ha WHERE ha.user_id = auth.uid() AND ha.hospital_id = hospitals.id))
  WITH CHECK (EXISTS (SELECT 1 FROM hospital_admins ha WHERE ha.user_id = auth.uid() AND ha.hospital_id = hospitals.id));

-- hospital_admins: read own assignment only
DROP POLICY IF EXISTS "Admins read own assignment" ON hospital_admins;
CREATE POLICY "Admins read own assignment" ON hospital_admins FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- cases
DROP POLICY IF EXISTS "Anyone can submit an incoming case" ON cases;
CREATE POLICY "Anyone can submit an incoming case" ON cases FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'incoming' AND is_synthetic = false);

DROP POLICY IF EXISTS "Admins read own facility cases" ON cases;
CREATE POLICY "Admins read own facility cases" ON cases FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM hospital_admins ha WHERE ha.user_id = auth.uid() AND ha.hospital_id = cases.hospital_id));

DROP POLICY IF EXISTS "Admins update own facility cases" ON cases;
CREATE POLICY "Admins update own facility cases" ON cases FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM hospital_admins ha WHERE ha.user_id = auth.uid() AND ha.hospital_id = cases.hospital_id))
  WITH CHECK (EXISTS (SELECT 1 FROM hospital_admins ha WHERE ha.user_id = auth.uid() AND ha.hospital_id = cases.hospital_id));

-- one-time facility assignment for a demo administrator
CREATE OR REPLACE FUNCTION claim_demo_facility(p_hospital_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_existing text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  SELECT hospital_id INTO v_existing FROM hospital_admins WHERE user_id = v_uid;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM hospitals WHERE id = p_hospital_id) THEN
    RAISE EXCEPTION 'Unknown facility';
  END IF;
  INSERT INTO hospital_admins (user_id, hospital_id) VALUES (v_uid, p_hospital_id);
  RETURN p_hospital_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION claim_demo_facility(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION claim_demo_facility(text) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'hospitals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE hospitals;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cases') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cases;
  END IF;
END $$;
