export interface ChronoStep {
  id: string;
  name: string;
  dureeMin: number;
}

export interface ChronoSection {
  id: string;
  name: string;
  steps: ChronoStep[];
}

export interface ChronoPreset {
  id: string;
  label: string;
  sections: ChronoSection[];
}

export interface TimerState {
  version: 1;
  sections: ChronoSection[];
  currentSectionIdx: number;
  currentStepIdx: number;
  secondsLeft: number;
  checkedStepIds: string[];
  soundEnabled: boolean;
  waitingForSectionValidation: boolean;
  savedAt: number;
}

export interface SavedPreset {
  id: string;
  label: string;
  createdAt: number;
  sections: ChronoSection[];
}

export interface SharePayload {
  label: string;
  sections: Array<{
    id?: string;
    name: string;
    steps: Array<{ name: string; dureeMin: number }>;
  }>;
}

export type Phase = 'config' | 'active' | 'done';
