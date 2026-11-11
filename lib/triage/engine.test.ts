import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectRedFlags, evaluateTriage, type TriageInput } from './engine.ts';
import { extractSymptomsFromText } from './catalog.ts';
import { DEMO_SCENARIOS } from '../demo-scenarios.ts';

const base: TriageInput = { age: 40, sex: 'female', symptoms: [], severity: 'mild', onset: 'today', history: [], screening: {} };

test('Scenario A: severe chest pain within the hour activates the emergency warning', () => {
  const r = evaluateTriage(DEMO_SCENARIOS.emergency.answers);
  assert.equal(r.urgency, 'emergency');
  assert.equal(r.pathway, 'emergency_assistance');
  assert.ok(r.redFlags.includes('Severe chest pain'));
});

test('immediate warning symptoms trigger the emergency path regardless of severity', () => {
  for (const s of ['stroke_signs', 'unconscious', 'seizure', 'severe_bleeding']) {
    const r = evaluateTriage({ ...base, symptoms: [s], severity: 'mild' });
    assert.equal(r.pathway, 'emergency_assistance', s);
  }
});

test('a "yes" to an emergency screening question escalates immediately', () => {
  const flags = detectRedFlags({ ...base, symptoms: ['chest_pain'], screening: { chest_radiating: true } });
  assert.ok(flags.length > 0);
  assert.equal(evaluateTriage({ ...base, symptoms: ['chest_pain'], screening: { chest_radiating: true } }).urgency, 'emergency');
});

test('free-text extraction detects warning symptoms used by the safety rules', () => {
  assert.ok(extractSymptomsFromText('I have crushing chest pressure').includes('chest_pain'));
});

test('free-text extraction understands Arabic descriptions', () => {
  assert.ok(extractSymptomsFromText('ألم شديد في الصدر منذ عشرين دقيقة').includes('chest_pain'));
  assert.ok(extractSymptomsFromText('عندي صعوبة في التنفس').includes('shortness_of_breath'));
  assert.ok(extractSymptomsFromText('أُغمي على والدي فجأة').includes('unconscious'));
  const mild = extractSymptomsFromText('عندي حمى وكحة من يومين');
  assert.ok(mild.includes('high_fever') && mild.includes('cough'));
  assert.ok(extractSymptomsFromText('لويت كاحلي وهو متورم').includes('injury'));
  const urinary = extractSymptomsFromText('حرقة عند التبول');
  assert.ok(urinary.includes('urinary_pain') && !urinary.includes('burn'));
  assert.ok(extractSymptomsFromText('حرق في يدي من الماء الساخن').includes('burn'));
});

test('Scenario B: stable fever and cough is routed to primary care without warning signs', () => {
  const r = evaluateTriage(DEMO_SCENARIOS.matching.answers);
  assert.equal(r.redFlags.length, 0);
  assert.equal(r.urgency, 'moderate');
  assert.equal(r.pathway, 'primary_care');
  assert.equal(r.specialty, 'family_medicine');
});

test('minor symptoms stay low urgency', () => {
  const r = evaluateTriage({ ...base, symptoms: ['sore_throat'] });
  assert.equal(r.urgency, 'low');
  assert.equal(r.pathway, 'primary_care');
});

test('a simple fall in Arabic is an injury, not loss of consciousness', () => {
  const ids = extractSymptomsFromText('طحت من الدرج');
  assert.ok(ids.includes('injury'));
  assert.ok(!ids.includes('unconscious'));
});

test('poisoning or overdose triggers the emergency path (English and Arabic)', () => {
  for (const text of ['I took too many pills', 'my child swallowed bleach', 'أخذ حبوب كثير', 'عنده تسمم', 'بلع كلوركس']) {
    const symptoms = extractSymptomsFromText(text);
    assert.ok(symptoms.includes('poisoning'), text);
    assert.equal(evaluateTriage({ ...base, symptoms }).pathway, 'emergency_assistance', text);
  }
});
