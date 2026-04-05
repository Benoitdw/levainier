import * as Crypto from 'expo-crypto';
import { deflateSync, inflateSync, strToU8, strFromU8 } from 'fflate';
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
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeProtocol(encoded: string): ChronoSection[] | null {
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
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
  } catch (e) {
    console.log('[decodeProtocol] error:', e);
    return null;
  }
}

export function buildShareUrl(label: string, sections: ChronoSection[]): string {
  const encoded = encodeProtocol(label, sections);
  return `${SHARE_BASE_URL}?p=${encoded}`;
}

// ── QR Code (format v2 compressé, préfixe "z.") ───────────────────────────────

function toB64url(bytes: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromB64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

export function encodeQRPayload(label: string, sections: ChronoSection[]): string {
  const payload: SharePayload = {
    label,
    sections: sections.map(s => ({
      id: s.id,
      name: s.name,
      steps: s.steps.map(st => ({ name: st.name, dureeMin: st.dureeMin })),
    })),
  };
  const compressed = deflateSync(strToU8(JSON.stringify(payload)));
  return 'z.' + toB64url(compressed);
}

export function decodeQRPayload(encoded: string): ChronoSection[] | null {
  try {
    // Format v2 compressé
    if (encoded.startsWith('z.')) {
      const bytes = fromB64url(encoded.slice(2));
      const json = strFromU8(inflateSync(bytes));
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
    }

    // Format v1 rétrocompatible
    return decodeProtocol(encoded);
  } catch (e) {
    console.log('[decodeQRPayload] error:', e);
    return null;
  }
}

export function buildQRUrl(label: string, sections: ChronoSection[]): string {
  return `${SHARE_BASE_URL}?p=${encodeQRPayload(label, sections)}`;
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
