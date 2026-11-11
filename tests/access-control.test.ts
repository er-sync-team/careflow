import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_ADMIN_PASSWORD, demoAdminEmail } from '../lib/demo-scenarios.ts';

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const skip = !URL_BASE || !ANON ? 'Supabase environment variables are not set' : false;

async function signIn(hospitalId: string): Promise<string> {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: demoAdminEmail(hospitalId), password: DEMO_ADMIN_PASSWORD }),
  });
  assert.equal(res.status, 200, 'demo admin sign-in should succeed');
  const json = await res.json();
  return json.access_token;
}

function rest(path: string, init: RequestInit & { token?: string; prefer?: string } = {}) {
  return fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: ANON!,
      Authorization: `Bearer ${init.token ?? ANON}`,
      'Content-Type': 'application/json',
      Prefer: init.prefer ?? 'return=representation',
    },
  });
}

async function waitOf(id: string): Promise<number> {
  const res = await rest(`hospitals?id=eq.${id}&select=wait_minutes`);
  const [row] = await res.json();
  return row.wait_minutes;
}

test('anonymous visitors cannot change hospital data', { skip }, async () => {
  const before = await waitOf('H01');
  const res = await rest('hospitals?id=eq.H01', { method: 'PATCH', body: JSON.stringify({ wait_minutes: before + 1 }) });
  const rows = res.ok ? await res.json() : [];
  assert.equal(rows.length, 0);
  assert.equal(await waitOf('H01'), before);
});

test("an administrator cannot edit another facility's data", { skip }, async () => {
  const token = await signIn('H06');
  const before = await waitOf('H01');
  const res = await rest('hospitals?id=eq.H01', { method: 'PATCH', token, body: JSON.stringify({ wait_minutes: before + 1 }) });
  const rows = res.ok ? await res.json() : [];
  assert.equal(rows.length, 0);
  assert.equal(await waitOf('H01'), before);
});

test('an administrator cannot change protected columns like name or location', { skip }, async () => {
  const token = await signIn('H06');
  const res = await rest('hospitals?id=eq.H06', { method: 'PATCH', token, body: JSON.stringify({ name: 'Hacked' }) });
  assert.equal(res.ok, false);
});

test("an administrator can update their own facility's operational data", { skip }, async () => {
  const token = await signIn('H06');
  const current = await waitOf('H06');
  const res = await rest('hospitals?id=eq.H06', { method: 'PATCH', token, body: JSON.stringify({ wait_minutes: current }) });
  assert.equal(res.status, 200);
  const rows = await res.json();
  assert.equal(rows.length, 1);
});

test("an administrator cannot read another facility's cases", { skip }, async () => {
  const token = await signIn('H06');
  const res = await rest('cases?hospital_id=eq.H01&select=id', { token });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);
});

test('patients cannot create cases that pretend to be past the incoming stage or synthetic', { skip }, async () => {
  const valid = {
    patient_alias: 'Patient #RLS1',
    age: 30,
    sex: 'female',
    symptoms: ['cough'],
    severity: 'mild',
    onset: 'days',
    urgency: 'low',
    pathway: 'primary_care',
    hospital_id: 'H06',
  };
  const discharged = await rest('cases', { method: 'POST', body: JSON.stringify({ ...valid, status: 'discharged' }) });
  assert.equal(discharged.ok, false);
  const synthetic = await rest('cases', { method: 'POST', body: JSON.stringify({ ...valid, is_synthetic: true }) });
  assert.equal(synthetic.ok, false);
});

test('anonymous visitors cannot read patient cases', { skip }, async () => {
  const res = await rest('cases?select=id&limit=1');
  const rows = res.ok ? await res.json() : [];
  assert.equal(rows.length, 0);
});

test('a patient without an account can submit a valid incoming case that reaches the right dashboard', { skip }, async () => {
  const alias = `Patient #T${Date.now().toString().slice(-3)}`;
  const res = await rest('cases', {
    method: 'POST',
    prefer: 'return=minimal',
    body: JSON.stringify({
      patient_alias: alias,
      age: 30,
      sex: 'female',
      symptoms: ['cough'],
      description: 'Automated access test',
      severity: 'mild',
      onset: 'days',
      urgency: 'low',
      pathway: 'primary_care',
      hospital_id: 'H06',
    }),
  });
  assert.equal(res.status, 201);

  const token = await signIn('H06');
  const found = await rest(`cases?patient_alias=eq.${encodeURIComponent(alias)}&select=id,status`, { token });
  const rows = await found.json();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, 'incoming');
  await rest(`cases?id=eq.${rows[0].id}`, { method: 'PATCH', token, body: JSON.stringify({ status: 'redirected' }) });
});
