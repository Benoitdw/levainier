import * as Crypto from 'expo-crypto';
import type { ChronoSection, ChronoPreset, SharePayload } from './types';

const SHARE_BASE_URL = 'https://benoitdw.github.io/laCuisineDeBenoit/pain/chrono/';

// ── Encode / Decode (compatible web app) ─────────────────────────────────────

export function encodeProtocol(label: string, sections: ChronoSection[]): string {
  const payload: SharePayload = {
    label,
    sections: sections.map(s => ({
      id: s.id,
      name: s.name,
      steps: s.steps.map(st => ({ name: st.name, dureeMin: st.dureeMin })),
    })),
  };
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json, 'utf-8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeProtocol(encoded: string): ChronoSection[] | null {
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(b64, 'base64').toString('utf-8');
    const payload = JSON.parse(json) as SharePayload;
    return payload.sections.map(s => ({
      id: s.id ?? Crypto.randomUUID(),
      name: s.name,
      steps: s.steps.map(st => ({
        id: Crypto.randomUUID(),
        name: st.name,
        dureeMin: st.dureeMin,
      })),
    }));
  } catch {
    return null;
  }
}

export function buildShareUrl(label: string, sections: ChronoSection[]): string {
  const encoded = encodeProtocol(label, sections);
  return `${SHARE_BASE_URL}?p=${encoded}`;
}

// ── Presets bundlés ──────────────────────────────────────────────────────────

interface RawStep    { name: string; dureeMin: number }
interface RawSection { id: string; name: string; steps: RawStep[] }
interface RawPreset  { id: string; label: string; sections: RawSection[] }

export function injectIds(raw: RawPreset): ChronoPreset {
  return {
    ...raw,
    sections: raw.sections.map(section => ({
      ...section,
      steps: section.steps.map(step => ({
        id: Crypto.randomUUID(),
        ...step,
      })),
    })),
  };
}

// ── Sérialisation preset pour export / partage ────────────────────────────────

export function slugify(str: string): string {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function serializePreset(label: string, sections: ChronoSection[]): string {
  return JSON.stringify({
    id: slugify(label) || 'protocole',
    label,
    sections: sections.map(sec => ({
      id: slugify(sec.name) || sec.id,
      name: sec.name,
      steps: sec.steps.map(st => ({ name: st.name, dureeMin: st.dureeMin })),
    })),
  }, null, 2);
}
