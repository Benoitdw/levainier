#!/usr/bin/env node
/**
 * Génère bell.wav et alarm.wav dans src/assets/sounds/
 * Fréquences identiques à la web app (ChronoPain.svelte playBell/playAlarm).
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../src/assets/sounds');

function writeWav(filename, sampleRate, samples) {
  const numSamples = samples.length;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);           // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), headerSize + i * 2);
  }

  fs.writeFileSync(path.join(OUT_DIR, filename), buffer);
  console.log(`✓ ${filename} (${numSamples} samples @ ${sampleRate}Hz)`);
}

const SR = 44100;

// ── bell.wav : sine 880 Hz, 1.2s, décroissance exponentielle ─────────────────
{
  const duration = 1.2;
  const freq = 880;
  const amplitude = 0.4;
  const n = Math.ceil(SR * duration);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-t / (duration / 5));
    samples[i] = amplitude * env * Math.sin(2 * Math.PI * freq * t);
  }
  writeWav('bell.wav', SR, samples);
}

// ── alarm.wav : 660/550 Hz alternés × 2, ~1.5s ───────────────────────────────
{
  const segDuration = 0.35;
  const freqs = [660, 550, 660, 550];
  const offsets = [0, 0.4, 0.8, 1.2];
  const totalDuration = 1.6;
  const amplitude = 0.3;
  const n = Math.ceil(SR * totalDuration);
  const samples = new Float32Array(n);

  freqs.forEach((freq, idx) => {
    const startSample = Math.floor(offsets[idx] * SR);
    const segSamples = Math.ceil(segDuration * SR);
    for (let i = 0; i < segSamples; i++) {
      const si = startSample + i;
      if (si >= n) break;
      const t = i / SR;
      const env = Math.exp(-t / (segDuration / 3));
      samples[si] += amplitude * env * Math.sin(2 * Math.PI * freq * t);
    }
  });

  writeWav('alarm.wav', SR, samples);
}

console.log('Sons générés dans src/assets/sounds/');
