/*
# Seed synthetic CareFlow demo data

1. Data
- 8 FICTIONAL facilities around Jeddah (5 hospitals with emergency departments, 3 primary care centers).
  All capacity, waiting time and staffing values are synthetic demo data and do not represent real hospitals.
- A set of synthetic incoming cases per facility (flagged `is_synthetic = true`) so the admin dashboard
  has realistic demo content.

2. Security
- No schema or policy changes.

3. Important Notes
  1. Inserts are idempotent: facilities use ON CONFLICT DO NOTHING; synthetic cases are inserted only
     when no synthetic cases exist yet.
*/

INSERT INTO hospitals (id, name, district, lat, lng, facility_type, has_ed, specialties, available_doctors, total_capacity, current_occupancy, wait_minutes, treatment_minutes, operational_status) VALUES
('H01','Corniche Coastal Medical Center','Al-Shati',21.5810,39.1090,'hospital',true,ARRAY['emergency_medicine','cardiology','neurology','internal_medicine','pulmonology','general_surgery'],14,60,41,35,90,'open'),
('H02','Rawdah Unity Hospital','Al-Rawdah',21.5600,39.1600,'hospital',true,ARRAY['emergency_medicine','orthopedics','general_surgery','internal_medicine','pediatrics'],9,45,40,70,80,'open'),
('H03','Nahda Children & Family Hospital','Al-Nahda',21.6050,39.1530,'hospital',true,ARRAY['emergency_medicine','pediatrics','obstetrics','internal_medicine'],11,40,22,25,70,'open'),
('H04','Obhur Heights General Hospital','North Obhur',21.7100,39.1000,'hospital',true,ARRAY['emergency_medicine','cardiology','orthopedics','neurology','pulmonology'],12,50,18,15,85,'open'),
('H05','Balad Heritage Hospital','Al-Balad',21.4850,39.1860,'hospital',true,ARRAY['emergency_medicine','internal_medicine','general_surgery','obstetrics'],6,35,33,95,75,'limited'),
('H06','Safa Primary Care Center','Al-Safa',21.5850,39.2100,'primary_care',false,ARRAY['family_medicine','pediatrics'],4,25,10,20,25,'open'),
('H07','Salamah Family Clinic','Al-Salamah',21.5950,39.1450,'primary_care',false,ARRAY['family_medicine','dermatology','ent'],3,20,14,35,20,'open'),
('H08','Hamra Community Health Center','Al-Hamra',21.5420,39.1650,'primary_care',false,ARRAY['family_medicine','internal_medicine'],5,20,6,10,25,'open')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  rec record;
BEGIN
  IF EXISTS (SELECT 1 FROM cases WHERE is_synthetic) THEN
    RETURN;
  END IF;
  FOR rec IN
    SELECT * FROM (VALUES
      ('H01','Patient #K4Q2',58,'male',ARRAY['chest_pain'],'Pressure in chest after climbing stairs, eased with rest.','moderate','today',ARRAY['heart_disease'],'high','emergency_department','cardiology',6.2,14,88,'incoming',12),
      ('H01','Patient #M9T1',34,'female',ARRAY['shortness_of_breath','cough'],'Wheezing since morning, inhaler partly helping.','moderate','today',ARRAY['asthma'],'high','emergency_department','pulmonology',3.1,8,91,'arrived',38),
      ('H01','Patient #R2B7',71,'male',ARRAY['dizziness'],'Light-headed when standing up.','mild','days',ARRAY['diabetes'],'moderate','emergency_department','internal_medicine',4.8,11,79,'in_treatment',95),
      ('H02','Patient #F6L3',27,'male',ARRAY['injury'],'Fell during football, ankle swollen, cannot bear weight.','moderate','hour',ARRAY[]::text[],'high','emergency_department','orthopedics',2.4,7,84,'incoming',6),
      ('H02','Patient #Z1P8',45,'female',ARRAY['abdominal_pain','vomiting'],'Right-sided abdominal pain worsening.','severe','today',ARRAY[]::text[],'high','emergency_department','general_surgery',5.5,13,76,'arrived',52),
      ('H03','Patient #C3N5',6,'female',ARRAY['high_fever','cough'],'Fever 39.2C for two days, drinking fluids.','moderate','days',ARRAY[]::text[],'moderate','emergency_department','pediatrics',3.9,10,92,'incoming',18),
      ('H03','Patient #W8D4',31,'female',ARRAY['abdominal_pain'],'Lower abdominal cramps, 24 weeks pregnant.','moderate','today',ARRAY['pregnancy'],'high','emergency_department','obstetrics',7.1,16,87,'in_treatment',70),
      ('H04','Patient #T5H9',63,'male',ARRAY['severe_headache'],'Headache with blurred vision, known hypertension.','moderate','today',ARRAY['hypertension'],'high','emergency_department','neurology',9.8,19,81,'incoming',22),
      ('H04','Patient #A7J6',19,'male',ARRAY['injury'],'Wrist pain after cycling fall.','moderate','hour',ARRAY[]::text[],'moderate','emergency_department','orthopedics',12.3,22,74,'discharged',180),
      ('H05','Patient #E2V1',52,'female',ARRAY['high_fever','urinary_pain'],'Burning urination and fever since yesterday.','moderate','days',ARRAY['diabetes'],'moderate','emergency_department','internal_medicine',2.0,6,62,'arrived',44),
      ('H06','Patient #G4S8',8,'male',ARRAY['ear_pain','high_fever'],'Ear ache since last night.','mild','today',ARRAY[]::text[],'low','primary_care','pediatrics',3.3,9,90,'incoming',9),
      ('H07','Patient #B6Y2',24,'female',ARRAY['rash'],'Itchy rash on arms for three days.','mild','days',ARRAY[]::text[],'low','primary_care','dermatology',1.8,5,93,'in_treatment',35),
      ('H08','Patient #N1X5',40,'male',ARRAY['sore_throat','cough'],'Sore throat and mild cough.','mild','days',ARRAY[]::text[],'low','primary_care','family_medicine',2.6,7,95,'incoming',15)
    ) AS t(hid, alias, age, sex, symptoms, descr, severity, onset, history, urgency, pathway, specialty, dist, eta, score, status, mins_ago)
  LOOP
    INSERT INTO cases (patient_alias, age, sex, symptoms, description, severity, onset, history, red_flags, urgency, pathway, specialty, screening_summary, hospital_id, distance_km, eta_minutes, match_score, status, timeline, is_synthetic, created_at)
    VALUES (
      rec.alias, rec.age, rec.sex, rec.symptoms, rec.descr, rec.severity, rec.onset, rec.history, '{}', rec.urgency, rec.pathway, rec.specialty,
      'Synthetic demonstration case. No immediate warning signs reported during screening.',
      rec.hid, rec.dist, rec.eta, rec.score, rec.status,
      CASE rec.status
        WHEN 'incoming' THEN jsonb_build_array(
          jsonb_build_object('status','assessed','at', now() - make_interval(mins => rec.mins_ago + 3),'note','Initial screening completed'),
          jsonb_build_object('status','incoming','at', now() - make_interval(mins => rec.mins_ago),'note','Facility selected by patient'))
        WHEN 'arrived' THEN jsonb_build_array(
          jsonb_build_object('status','assessed','at', now() - make_interval(mins => rec.mins_ago + 3),'note','Initial screening completed'),
          jsonb_build_object('status','incoming','at', now() - make_interval(mins => rec.mins_ago),'note','Facility selected by patient'),
          jsonb_build_object('status','arrived','at', now() - make_interval(mins => GREATEST(rec.mins_ago - rec.eta, 1)),'note','Patient checked in at reception'))
        WHEN 'in_treatment' THEN jsonb_build_array(
          jsonb_build_object('status','assessed','at', now() - make_interval(mins => rec.mins_ago + 3),'note','Initial screening completed'),
          jsonb_build_object('status','incoming','at', now() - make_interval(mins => rec.mins_ago),'note','Facility selected by patient'),
          jsonb_build_object('status','arrived','at', now() - make_interval(mins => GREATEST(rec.mins_ago - rec.eta, 2)),'note','Patient checked in at reception'),
          jsonb_build_object('status','in_treatment','at', now() - make_interval(mins => GREATEST(rec.mins_ago - rec.eta - 20, 1)),'note','Seen by clinician'))
        ELSE jsonb_build_array(
          jsonb_build_object('status','assessed','at', now() - make_interval(mins => rec.mins_ago + 3),'note','Initial screening completed'),
          jsonb_build_object('status','incoming','at', now() - make_interval(mins => rec.mins_ago),'note','Facility selected by patient'),
          jsonb_build_object('status','arrived','at', now() - make_interval(mins => rec.mins_ago - rec.eta),'note','Patient checked in at reception'),
          jsonb_build_object('status','in_treatment','at', now() - make_interval(mins => rec.mins_ago - rec.eta - 30),'note','Seen by clinician'),
          jsonb_build_object('status','discharged','at', now() - make_interval(mins => 20),'note','Discharged with follow-up advice'))
      END,
      true,
      now() - make_interval(mins => rec.mins_ago)
    );
  END LOOP;
END $$;
