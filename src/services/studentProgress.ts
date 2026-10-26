/**
 * Student Progress Persistence Service
 * BAPHY105 CHAMP Virtual Physics Laboratory
 *
 * Tracks student lab practice, completed steps, observation table recordings,
 * viva scores, and run timestamps honestly in browser localStorage.
 */

export interface ExperimentProgressRecord {
  experimentId: string;
  isPractised: boolean;
  completedSteps: number[];
  recordedRowsCount: number;
  lastPractisedAt: string | null;
  vivaScore: number | null;
  savedRunSummary?: string;
}

export interface StudentProgressState {
  version: number;
  completedExperimentIds: string[];
  records: Record<string, ExperimentProgressRecord>;
  vivaScores: Record<string, number>;
  updatedAt: string;
}

const STORAGE_KEY = 'champ_lab_student_progress_v2';
const CURRENT_VERSION = 2;

const ALL_EXPERIMENT_IDS = [
  'expt-1-solar-cell',
  'expt-2-mercury-grating',
  'expt-3-led-planck',
  'expt-4-quantum-tunneling',
  'expt-5-sodium-grating',
  'expt-6-photodiode',
  'expt-7-electron-diffraction',
  'expt-8-heisenberg-slit',
  'expt-9-quantum-computing',
];

function getInitialProgressState(): StudentProgressState {
  const initialRecords: Record<string, ExperimentProgressRecord> = {};
  for (const id of ALL_EXPERIMENT_IDS) {
    initialRecords[id] = {
      experimentId: id,
      isPractised: false,
      completedSteps: [],
      recordedRowsCount: 0,
      lastPractisedAt: null,
      vivaScore: null,
    };
  }
  return {
    version: CURRENT_VERSION,
    completedExperimentIds: [],
    records: initialRecords,
    vivaScores: {},
    updatedAt: new Date().toISOString(),
  };
}

let inMemoryState: StudentProgressState = getInitialProgressState();
const listeners = new Set<(state: StudentProgressState) => void>();

function notifyListeners() {
  for (const fn of listeners) {
    try {
      fn(inMemoryState);
    } catch (e) {
      console.error('Error notifying progress listener', e);
    }
  }
}

export function loadStudentProgress(): StudentProgressState {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      inMemoryState = getInitialProgressState();
      return inMemoryState;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.version !== CURRENT_VERSION) {
      inMemoryState = getInitialProgressState();
      return inMemoryState;
    }
    inMemoryState = {
      version: CURRENT_VERSION,
      completedExperimentIds: Array.isArray(parsed.completedExperimentIds)
        ? parsed.completedExperimentIds.filter((id: string) => ALL_EXPERIMENT_IDS.includes(id))
        : [],
      records: parsed.records && typeof parsed.records === 'object' ? parsed.records : {},
      vivaScores: parsed.vivaScores && typeof parsed.vivaScores === 'object' ? parsed.vivaScores : {},
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
    return inMemoryState;
  } catch {
    inMemoryState = getInitialProgressState();
    return inMemoryState;
  }
}

export function saveStudentProgress(state: StudentProgressState): void {
  inMemoryState = { ...state, updatedAt: new Date().toISOString() };
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryState));
    }
  } catch (e) {
    console.warn('LocalStorage save failed; using in-memory progress', e);
  }
  notifyListeners();
}

/**
 * Validates and records genuine student practice on an experiment.
 * Marked complete only when genuine student interactions occur (e.g. recorded observations).
 */
export function recordExperimentPractice(
  experimentId: string,
  data: {
    completedSteps?: number[];
    recordedRowsCount?: number;
    summary?: string;
  }
): { success: boolean; isPractised: boolean; message: string } {
  const state = loadStudentProgress();
  const current = state.records[experimentId] || {
    experimentId,
    isPractised: false,
    completedSteps: [],
    recordedRowsCount: 0,
    lastPractisedAt: null,
    vivaScore: null,
  };

  const steps = data.completedSteps
    ? Array.from(new Set([...current.completedSteps, ...data.completedSteps]))
    : current.completedSteps;
  const rows = Math.max(current.recordedRowsCount, data.recordedRowsCount ?? 0);

  // Criteria for genuine completion:
  // Must have either recorded observations (rows > 0) OR completed at least 2 guided steps.
  const qualifies = rows >= 1 || steps.length >= 2;

  const updatedRecord: ExperimentProgressRecord = {
    ...current,
    isPractised: qualifies || current.isPractised,
    completedSteps: steps,
    recordedRowsCount: rows,
    lastPractisedAt: new Date().toISOString(),
    savedRunSummary: data.summary || current.savedRunSummary,
  };

  state.records[experimentId] = updatedRecord;

  if (updatedRecord.isPractised && !state.completedExperimentIds.includes(experimentId)) {
    state.completedExperimentIds = [...state.completedExperimentIds, experimentId];
  }

  saveStudentProgress(state);

  return {
    success: true,
    isPractised: updatedRecord.isPractised,
    message: updatedRecord.isPractised
      ? `Experiment recorded as completed (${rows} observation rows logged).`
      : 'Progress updated. Complete additional measurements to mark as practised.',
  };
}

export function recordVivaScore(experimentId: string, score: number): void {
  const state = loadStudentProgress();
  state.vivaScores[experimentId] = score;
  if (state.records[experimentId]) {
    state.records[experimentId].vivaScore = score;
  }
  saveStudentProgress(state);
}

export function resetAllStudentProgress(): void {
  const initial = getInitialProgressState();
  saveStudentProgress(initial);
}

export const resetStudentProgress = resetAllStudentProgress;

export function subscribeToStudentProgress(
  listener: (state: StudentProgressState) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
