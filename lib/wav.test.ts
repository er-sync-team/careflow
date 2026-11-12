import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeWav, resample, toBase64, SPEECH_RATE } from './wav.ts';

test('resampling 48 kHz to 16 kHz keeps duration and joins chunks', () => {
  const second = new Float32Array(48000).fill(0.5);
  const out = resample([second.subarray(0, 20000), second.subarray(20000)], 48000);
  assert.equal(out.length, SPEECH_RATE);
  assert.ok(Math.abs(out[100] - 0.5) < 1e-6);
});

test('WAV header is valid 16-bit mono PCM at 16 kHz', () => {
  const wav = encodeWav(new Float32Array([0, 1, -1, 2]));
  const v = new DataView(wav.buffer);
  const ascii = (o: number) => String.fromCharCode.apply(null, Array.from(wav.subarray(o, o + 4)));
  assert.equal(ascii(0), 'RIFF');
  assert.equal(ascii(8), 'WAVE');
  assert.equal(v.getUint16(22, true), 1);
  assert.equal(v.getUint32(24, true), 16000);
  assert.equal(v.getUint16(34, true), 16);
  assert.equal(v.getUint32(40, true), 8);
  assert.equal(v.getInt16(46, true), 0x7fff); // 1.0
  assert.equal(v.getInt16(48, true), -0x8000); // -1.0
  assert.equal(v.getInt16(50, true), 0x7fff); // clipped 2.0
});

test('base64 handles large buffers', () => {
  const bytes = new Uint8Array(200000).map((_, i) => i % 256);
  assert.deepEqual(new Uint8Array(Buffer.from(toBase64(bytes), 'base64')), bytes);
});
