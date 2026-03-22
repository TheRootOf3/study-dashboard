import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import { completionsApi, confusionApi, settingsApi, type Completion, type ConfusionEntry, type Settings } from '../api/client';
import studyPlanData from '../data/studyPlan.json';
import type { StudyPlan } from '../utils/progressCalc';
import { DEFAULT_DAY_MAPPING, type DaySlotMapping } from '../utils/dateUtils';

const studyPlan = studyPlanData as StudyPlan;

interface State {
  completions: Map<string, Completion>;
  confusionLog: ConfusionEntry[];
  settings: Settings;
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'LOAD_DATA'; completions: Completion[]; confusionLog: ConfusionEntry[]; settings: Settings }
  | { type: 'UPSERT_COMPLETION'; completion: Completion }
  | { type: 'REMOVE_COMPLETION'; slotId: string }
  | { type: 'ADD_CONFUSION'; entry: ConfusionEntry }
  | { type: 'UPDATE_CONFUSION'; entry: ConfusionEntry }
  | { type: 'REMOVE_CONFUSION'; id: string }
  | { type: 'SET_CONFUSION_LOG'; entries: ConfusionEntry[] }
  | { type: 'UPDATE_SETTINGS'; settings: Settings };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    case 'LOAD_DATA': {
      const map = new Map<string, Completion>();
      for (const c of action.completions) map.set(c.slot_id, c);
      return { ...state, completions: map, confusionLog: action.confusionLog, settings: action.settings, loading: false };
    }
    case 'UPSERT_COMPLETION': {
      const map = new Map(state.completions);
      map.set(action.completion.slot_id, action.completion);
      return { ...state, completions: map };
    }
    case 'REMOVE_COMPLETION': {
      const map = new Map(state.completions);
      map.delete(action.slotId);
      return { ...state, completions: map };
    }
    case 'ADD_CONFUSION':
      return { ...state, confusionLog: [action.entry, ...state.confusionLog] };
    case 'UPDATE_CONFUSION':
      return { ...state, confusionLog: state.confusionLog.map(e => e.id === action.entry.id ? action.entry : e) };
    case 'REMOVE_CONFUSION':
      return { ...state, confusionLog: state.confusionLog.filter(e => e.id !== action.id) };
    case 'SET_CONFUSION_LOG':
      return { ...state, confusionLog: action.entries };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.settings };
    default:
      return state;
  }
}

interface ProgressContextValue {
  state: State;
  studyPlan: StudyPlan;
  dayMapping: DaySlotMapping;
  toggleCompletion: (slotId: string, completed: boolean) => Promise<void>;
  updateSlotNotes: (slotId: string, notes: string) => Promise<void>;
  updateSlotDifficulty: (slotId: string, difficulty: number | null) => Promise<void>;
  addConfusionEntry: (data: { topic: string; description: string; weekId: string }) => Promise<void>;
  updateConfusionEntry: (id: string, data: Partial<Pick<ConfusionEntry, 'topic' | 'description' | 'resolution' | 'resolved'>>) => Promise<void>;
  removeConfusionEntry: (id: string) => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    completions: new Map(),
    confusionLog: [],
    settings: { actual_start_date: null, theme: 'light', day_mapping: null },
    loading: true,
    error: null,
  });

  const loadData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const [completions, confusionLog, settings] = await Promise.all([
        completionsApi.getAll(),
        confusionApi.getAll(),
        settingsApi.get(),
      ]);
      dispatch({ type: 'LOAD_DATA', completions, confusionLog, settings });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', error: (e as Error).message });
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Apply dark mode class when settings load or change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.theme === 'dark');
  }, [state.settings.theme]);

  const toggleCompletion = useCallback(async (slotId: string, completed: boolean) => {
    const existing = state.completions.get(slotId);
    const result = await completionsApi.upsert(slotId, {
      completed: completed ? 1 : 0,
      notes: existing?.notes || '',
      difficulty: existing?.difficulty ?? null,
    });
    dispatch({ type: 'UPSERT_COMPLETION', completion: result });
  }, [state.completions]);

  const updateSlotNotes = useCallback(async (slotId: string, notes: string) => {
    const existing = state.completions.get(slotId);
    const result = await completionsApi.upsert(slotId, {
      completed: existing?.completed ?? 0,
      notes,
      difficulty: existing?.difficulty ?? null,
    });
    dispatch({ type: 'UPSERT_COMPLETION', completion: result });
  }, [state.completions]);

  const updateSlotDifficulty = useCallback(async (slotId: string, difficulty: number | null) => {
    const existing = state.completions.get(slotId);
    const result = await completionsApi.upsert(slotId, {
      completed: existing?.completed ?? 0,
      notes: existing?.notes || '',
      difficulty,
    });
    dispatch({ type: 'UPSERT_COMPLETION', completion: result });
  }, [state.completions]);

  const addConfusionEntry = useCallback(async (data: { topic: string; description: string; weekId: string }) => {
    const entry = await confusionApi.create(data);
    dispatch({ type: 'ADD_CONFUSION', entry });
  }, []);

  const updateConfusionEntry = useCallback(async (id: string, data: Partial<Pick<ConfusionEntry, 'topic' | 'description' | 'resolution' | 'resolved'>>) => {
    const entry = await confusionApi.update(id, data);
    dispatch({ type: 'UPDATE_CONFUSION', entry });
  }, []);

  const removeConfusionEntry = useCallback(async (id: string) => {
    await confusionApi.remove(id);
    dispatch({ type: 'REMOVE_CONFUSION', id });
  }, []);

  const updateSettings = useCallback(async (data: Partial<Settings>) => {
    const settings = await settingsApi.update(data);
    dispatch({ type: 'UPDATE_SETTINGS', settings });
  }, []);

  const dayMapping: DaySlotMapping = state.settings.day_mapping
    ? JSON.parse(state.settings.day_mapping)
    : DEFAULT_DAY_MAPPING;

  return (
    <ProgressContext.Provider
      value={{
        state,
        studyPlan,
        dayMapping,
        toggleCompletion,
        updateSlotNotes,
        updateSlotDifficulty,
        addConfusionEntry,
        updateConfusionEntry,
        removeConfusionEntry,
        updateSettings,
        refreshData: loadData,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
