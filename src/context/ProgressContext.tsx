import { createContext, useContext, useReducer, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { completionsApi, confusionApi, settingsApi, subtaskCompletionsApi, type Completion, type ConfusionEntry, type Settings, type SubtaskCompletion } from '../api/client';
import studyPlanData from '../data/studyPlan.json';
import type { StudyPlan } from '../utils/progressCalc';
import { type DaySlotMapping } from '../utils/dateUtils';
import { DEFAULT_SCHEDULE_CONFIG, type ScheduleConfig } from '../utils/scheduleConfig';

const studyPlan = studyPlanData as StudyPlan;

interface State {
  completions: Map<string, Completion>;
  subtaskCompletions: Map<string, SubtaskCompletion>;
  confusionLog: ConfusionEntry[];
  settings: Settings;
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'LOAD_DATA'; completions: Completion[]; subtaskCompletions: SubtaskCompletion[]; confusionLog: ConfusionEntry[]; settings: Settings }
  | { type: 'UPSERT_COMPLETION'; completion: Completion }
  | { type: 'REMOVE_COMPLETION'; slotId: string }
  | { type: 'UPSERT_SUBTASK'; subtask: SubtaskCompletion }
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
      const stMap = new Map<string, SubtaskCompletion>();
      for (const s of action.subtaskCompletions) stMap.set(s.subtask_id, s);
      return { ...state, completions: map, subtaskCompletions: stMap, confusionLog: action.confusionLog, settings: action.settings, loading: false };
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
    case 'UPSERT_SUBTASK': {
      const stMap = new Map(state.subtaskCompletions);
      if (action.subtask.completed) {
        stMap.set(action.subtask.subtask_id, action.subtask);
      } else {
        stMap.delete(action.subtask.subtask_id);
      }
      return { ...state, subtaskCompletions: stMap };
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
  scheduleConfig: ScheduleConfig;
  dayMapping: DaySlotMapping;
  toggleCompletion: (slotId: string, completed: boolean) => Promise<void>;
  toggleSubtask: (subtaskId: string, completed: boolean, slotId: string, totalSubtasks: number) => Promise<void>;
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
    subtaskCompletions: new Map(),
    confusionLog: [],
    settings: { actual_start_date: null, theme: 'light', day_mapping: null, schedule_config: null },
    loading: true,
    error: null,
  });

  const loadData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const [completions, subtaskCompletions, confusionLog, settings] = await Promise.all([
        completionsApi.getAll(),
        subtaskCompletionsApi.getAll(),
        confusionApi.getAll(),
        settingsApi.get(),
      ]);
      dispatch({ type: 'LOAD_DATA', completions, subtaskCompletions, confusionLog, settings });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', error: (e as Error).message });
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // On first load with a fresh DB, adopt the OS theme preference.
  const systemThemeApplied = useRef(false);
  useEffect(() => {
    if (state.loading || systemThemeApplied.current) return;
    systemThemeApplied.current = true;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark && state.settings.theme === 'light') {
      updateSettings({ theme: 'dark' });
    }
  }, [state.loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Always sync the dark class with the current theme setting
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

  const toggleSubtask = useCallback(async (subtaskId: string, completed: boolean, slotId: string, totalSubtasks: number) => {
    const result = await subtaskCompletionsApi.upsert(subtaskId, completed);
    dispatch({ type: 'UPSERT_SUBTASK', subtask: result });

    // Auto-complete the parent slot when all subtasks are done
    // Count how many subtasks for this slot will be completed after this toggle
    const slotPrefix = slotId + '-sub-';
    let completedCount = 0;
    for (const [id] of state.subtaskCompletions) {
      if (id.startsWith(slotPrefix) && id !== subtaskId) completedCount++;
    }
    if (completed) completedCount++;

    const allDone = completedCount >= totalSubtasks;
    const existing = state.completions.get(slotId);
    const currentlyCompleted = !!existing?.completed;

    if (allDone && !currentlyCompleted) {
      const res = await completionsApi.upsert(slotId, {
        completed: 1,
        notes: existing?.notes || '',
        difficulty: existing?.difficulty ?? null,
      });
      dispatch({ type: 'UPSERT_COMPLETION', completion: res });
    } else if (!allDone && currentlyCompleted) {
      const res = await completionsApi.upsert(slotId, {
        completed: 0,
        notes: existing?.notes || '',
        difficulty: existing?.difficulty ?? null,
      });
      dispatch({ type: 'UPSERT_COMPLETION', completion: res });
    }
  }, [state.subtaskCompletions, state.completions]);

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

  const scheduleConfig: ScheduleConfig = state.settings.schedule_config
    ? JSON.parse(state.settings.schedule_config)
    : DEFAULT_SCHEDULE_CONFIG;

  // dayMapping is now derived from scheduleConfig (kept for backward compat)
  const dayMapping: DaySlotMapping = scheduleConfig.dayMapping;

  return (
    <ProgressContext.Provider
      value={{
        state,
        studyPlan,
        scheduleConfig,
        dayMapping,
        toggleCompletion,
        toggleSubtask,
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
