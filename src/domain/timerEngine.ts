import type { TimerState, ChronoSection } from './types';

/**
 * Logique pure du timer — port direct de ChronoPain.svelte.
 * Aucune dépendance React Native.
 */

export function advanceStep(state: TimerState): TimerState {
  const section = state.sections[state.currentSectionIdx];
  const nextTi = state.currentStepIdx + 1;

  if (nextTi < section.steps.length) {
    return {
      ...state,
      currentStepIdx: nextTi,
      secondsLeft: section.steps[nextTi].dureeMin * 60,
      savedAt: Date.now(),
    };
  }

  const nextSi = state.currentSectionIdx + 1;
  if (nextSi < state.sections.length) {
    return {
      ...state,
      secondsLeft: 0,
      waitingForSectionValidation: true,
      savedAt: Date.now(),
    };
  }

  // Dernière étape de la dernière section → done géré par le store
  return {
    ...state,
    secondsLeft: 0,
    waitingForSectionValidation: false,
    savedAt: Date.now(),
  };
}

export function validateSection(state: TimerState): TimerState {
  const nextSi = state.currentSectionIdx + 1;
  const nextSection = state.sections[nextSi];
  return {
    ...state,
    currentSectionIdx: nextSi,
    currentStepIdx: 0,
    secondsLeft: nextSection.steps[0].dureeMin * 60,
    waitingForSectionValidation: false,
    savedAt: Date.now(),
  };
}

/**
 * Avance le timer d'après le temps écoulé depuis savedAt,
 * sans jamais franchir une frontière de section (validation manuelle requise).
 * Port direct de ChronoPain.svelte.
 */
export function applyElapsedTime(state: TimerState): TimerState {
  if (state.waitingForSectionValidation) return state;

  let elapsed = Math.max(0, Math.floor((Date.now() - state.savedAt) / 1000));
  if (elapsed <= 0) return state;

  const section: ChronoSection = state.sections[state.currentSectionIdx];
  if (!section) return state;

  let sti = state.currentStepIdx;
  let sLeft = state.secondsLeft;

  while (elapsed > 0) {
    if (elapsed < sLeft) {
      sLeft -= elapsed;
      elapsed = 0;
    } else {
      elapsed -= sLeft;
      const next = sti + 1;
      if (next >= section.steps.length) {
        sLeft = 0;
        return {
          ...state,
          currentStepIdx: sti,
          secondsLeft: 0,
          waitingForSectionValidation: true,
          savedAt: Date.now(),
        };
      } else {
        sti = next;
        sLeft = section.steps[sti].dureeMin * 60;
      }
    }
  }

  return { ...state, currentStepIdx: sti, secondsLeft: sLeft };
}

export function computeElapsedSeconds(state: TimerState): number {
  let elapsed = 0;
  for (let si = 0; si < state.currentSectionIdx; si++) {
    elapsed += state.sections[si].steps.reduce((a, st) => a + st.dureeMin * 60, 0);
  }
  const sec = state.sections[state.currentSectionIdx];
  if (sec) {
    for (let ti = 0; ti < state.currentStepIdx; ti++) {
      elapsed += sec.steps[ti].dureeMin * 60;
    }
    const st = sec.steps[state.currentStepIdx];
    if (st) elapsed += st.dureeMin * 60 - state.secondsLeft;
  }
  return elapsed;
}

export function computeTotalSeconds(sections: TimerState['sections']): number {
  return sections.reduce((sum, s) => sum + s.steps.reduce((a, st) => a + st.dureeMin * 60, 0), 0);
}

export function computeSecondsToSectionEnd(state: TimerState): number {
  let total = state.secondsLeft;
  const sec = state.sections[state.currentSectionIdx];
  if (!sec) return 0;
  for (let ti = state.currentStepIdx + 1; ti < sec.steps.length; ti++) {
    total += sec.steps[ti].dureeMin * 60;
  }
  return total;
}

export function formatTime(s: number): string {
  const abs = Math.max(0, Math.round(s));
  return `${Math.floor(abs / 60)}:${(abs % 60).toString().padStart(2, '0')}`;
}

export function formatHour(ms: number): string {
  return new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatTotalLabel(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
  return `${m} min`;
}
