import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { Phase, TimerState, ChronoSection, ChronoPreset, SavedPreset } from '../domain/types';
import { advanceStep, validateSection, applyElapsedTime } from '../domain/timerEngine';
import { injectIds } from '../domain/protocol';
import levainJson from '../assets/presets/levain.json';
import levureJson from '../assets/presets/levure.json';

const STORAGE_KEY = 'levainier_state';
const CUSTOM_PRESETS_KEY = 'levainier_customPresets';

// Presets bundlés (IDs injectés au démarrage)
export const BUNDLED_PRESETS: ChronoPreset[] = [
  injectIds(levainJson as any),
  injectIds(levureJson as any),
];

// ── Types du store ────────────────────────────────────────────────────────────

interface StoreState {
  // Navigation
  phase: Phase;

  // Config
  sections: ChronoSection[];
  selectedPresetId: string | null;

  // Timer actif
  timer: TimerState | null;

  // Presets custom
  customPresets: SavedPreset[];

  // Préférences
  soundEnabled: boolean;

  // Hydratation
  hydrated: boolean;
}

interface StoreActions {
  // Cycle de vie
  hydrate: () => Promise<void>;
  resetTimer: () => void;

  // Config
  setSections: (sections: ChronoSection[]) => void;
  loadPreset: (preset: ChronoPreset) => void;
  addSection: (atIndex?: number) => void;
  removeSection: (si: number) => void;
  addStep: (si: number, atIndex?: number) => void;
  removeStep: (si: number, ti: number) => void;
  updateSectionName: (si: number, name: string) => void;
  updateStepName: (si: number, ti: number, name: string) => void;
  updateStepDuree: (si: number, ti: number, val: number) => void;

  // Timer
  startTimer: () => void;
  tickSecond: () => void;
  advanceStepAction: () => void;
  validateSectionAction: () => void;
  toggleCheck: (stepId: string) => void;
  togglePause: () => void;
  applyElapsed: () => void;

  // Presets custom
  saveCustomPreset: (label: string) => Promise<void>;
  updateCustomPreset: (id: string, label: string, sections: ChronoSection[]) => Promise<void>;
  deleteCustomPreset: (id: string) => Promise<void>;

  // Préférences
  toggleSound: () => void;
}

type Store = StoreState & StoreActions;

// ── AsyncStorage helpers ──────────────────────────────────────────────────────

async function persistTimer(timer: TimerState | null) {
  if (timer) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

async function persistCustomPresets(presets: SavedPreset[]) {
  await AsyncStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useTimerStore = create<Store>((set, get) => ({
  phase: 'config',
  sections: [...BUNDLED_PRESETS[0].sections],
  selectedPresetId: BUNDLED_PRESETS[0].id,
  timer: null,
  customPresets: [],
  soundEnabled: true,
  hydrated: false,

  // ── Hydratation ────────────────────────────────────────────────────────────

  hydrate: async () => {
    const [rawTimer, rawPresets] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(CUSTOM_PRESETS_KEY),
    ]);

    const customPresets: SavedPreset[] = rawPresets ? JSON.parse(rawPresets) : [];

    if (rawTimer) {
      const saved: TimerState = JSON.parse(rawTimer);
      const resumed = applyElapsedTime(saved);
      set({
        timer: resumed,
        sections: resumed.sections,
        soundEnabled: resumed.soundEnabled,
        phase: 'active',
        customPresets,
        hydrated: true,
      });
    } else {
      set({ customPresets, hydrated: true });
    }
  },

  // ── Reset ──────────────────────────────────────────────────────────────────

  resetTimer: () => {
    AsyncStorage.removeItem(STORAGE_KEY);
    set({ phase: 'config', timer: null });
  },

  // ── Config ─────────────────────────────────────────────────────────────────

  setSections: (sections) => set({ sections }),

  loadPreset: (preset) => {
    // Ré-injecte les UUIDs à chaque chargement
    const fresh = injectIds(preset as any);
    set({ sections: fresh.sections, selectedPresetId: preset.id });
  },

  addSection: (atIndex) => {
    const { sections } = get();
    const newSections = [...sections];
    const idx = atIndex ?? newSections.length;
    newSections.splice(idx, 0, {
      id: Crypto.randomUUID(),
      name: 'Nouvelle section',
      steps: [{ id: Crypto.randomUUID(), name: 'Étape', dureeMin: 30 }],
    });
    set({ sections: newSections });
  },

  removeSection: (si) => {
    const newSections = [...get().sections];
    newSections.splice(si, 1);
    set({ sections: newSections });
  },

  addStep: (si, atIndex) => {
    const newSections = get().sections.map(s => ({ ...s, steps: [...s.steps] }));
    const idx = atIndex ?? newSections[si].steps.length;
    newSections[si].steps.splice(idx, 0, {
      id: Crypto.randomUUID(),
      name: 'Étape',
      dureeMin: 15,
    });
    set({ sections: newSections });
  },

  removeStep: (si, ti) => {
    const newSections = get().sections.map(s => ({ ...s, steps: [...s.steps] }));
    newSections[si].steps.splice(ti, 1);
    set({ sections: newSections });
  },

  updateSectionName: (si, name) => {
    const newSections = get().sections.map((s, i) => i === si ? { ...s, name } : s);
    set({ sections: newSections });
  },

  updateStepName: (si, ti, name) => {
    const newSections = get().sections.map((s, i) =>
      i === si
        ? { ...s, steps: s.steps.map((st, j) => j === ti ? { ...st, name } : st) }
        : s
    );
    set({ sections: newSections });
  },

  updateStepDuree: (si, ti, val) => {
    const newSections = get().sections.map((s, i) =>
      i === si
        ? { ...s, steps: s.steps.map((st, j) => j === ti ? { ...st, dureeMin: Math.max(1, val) } : st) }
        : s
    );
    set({ sections: newSections });
  },

  // ── Timer ──────────────────────────────────────────────────────────────────

  startTimer: () => {
    const { sections, soundEnabled } = get();
    const firstSi = sections.findIndex(s => s.steps.length > 0);
    if (firstSi < 0) return;

    const timer: TimerState = {
      version: 1,
      sections,
      currentSectionIdx: firstSi,
      currentStepIdx: 0,
      secondsLeft: sections[firstSi].steps[0].dureeMin * 60,
      checkedStepIds: [],
      soundEnabled,
      waitingForSectionValidation: false,
      savedAt: Date.now(),
    };

    persistTimer(timer);
    set({ timer, phase: 'active' });
  },

  tickSecond: () => {
    const { timer } = get();
    if (!timer || timer.waitingForSectionValidation) return;

    if (timer.secondsLeft > 1) {
      const updated = { ...timer, secondsLeft: timer.secondsLeft - 1, savedAt: Date.now() };
      persistTimer(updated);
      set({ timer: updated });
    } else {
      // Fin d'étape : advanceStep (store gère la transition phase done)
      get().advanceStepAction();
    }
  },

  advanceStepAction: () => {
    const { timer } = get();
    if (!timer) return;

    const section = timer.sections[timer.currentSectionIdx];
    const isLastStep = timer.currentStepIdx >= section.steps.length - 1;
    const isLastSection = timer.currentSectionIdx >= timer.sections.length - 1;

    const next = advanceStep(timer);

    if (isLastStep && isLastSection) {
      persistTimer(null);
      set({ timer: next, phase: 'done' });
    } else {
      persistTimer(next);
      set({ timer: next });
    }
  },

  validateSectionAction: () => {
    const { timer } = get();
    if (!timer) return;
    const next = validateSection(timer);
    persistTimer(next);
    set({ timer: next });
  },

  toggleCheck: (stepId) => {
    const { timer } = get();
    if (!timer) return;
    const checked = timer.checkedStepIds.includes(stepId)
      ? timer.checkedStepIds.filter(id => id !== stepId)
      : [...timer.checkedStepIds, stepId];
    const updated = { ...timer, checkedStepIds: checked };
    persistTimer(updated);
    set({ timer: updated });
  },

  togglePause: () => {
    const { timer } = get();
    if (!timer) return;
    // Le "pause" est géré par l'intervalle du composant — on stocke juste l'état
    set({ timer: { ...timer, savedAt: Date.now() } });
  },

  applyElapsed: () => {
    const { timer } = get();
    if (!timer) return;
    const updated = applyElapsedTime(timer);
    persistTimer(updated);
    set({ timer: updated });
  },

  // ── Presets custom ─────────────────────────────────────────────────────────

  saveCustomPreset: async (label) => {
    const { sections, customPresets } = get();
    const newPreset: SavedPreset = {
      id: Crypto.randomUUID(),
      label,
      createdAt: Date.now(),
      sections: sections.map(s => ({
        ...s,
        steps: s.steps.map(st => ({ ...st })),
      })),
    };
    const updated = [...customPresets, newPreset];
    await persistCustomPresets(updated);
    set({ customPresets: updated });
  },

  updateCustomPreset: async (id, label, sections) => {
    const updated = get().customPresets.map(p =>
      p.id === id ? { ...p, label, sections } : p
    );
    await persistCustomPresets(updated);
    set({ customPresets: updated });
  },

  deleteCustomPreset: async (id) => {
    const updated = get().customPresets.filter(p => p.id !== id);
    await persistCustomPresets(updated);
    set({ customPresets: updated });
  },

  // ── Préférences ────────────────────────────────────────────────────────────

  toggleSound: () => {
    const newVal = !get().soundEnabled;
    set({ soundEnabled: newVal });
    const { timer } = get();
    if (timer) {
      const updated = { ...timer, soundEnabled: newVal };
      persistTimer(updated);
      set({ timer: updated });
    }
  },
}));
