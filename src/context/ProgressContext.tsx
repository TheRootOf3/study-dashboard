import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import { completionsApi, confusionApi, subtaskCompletionsApi, studyPlanApi, type Completion, type ConfusionEntry, type SubtaskCompletion } from '../api/client';
import type { StudyPlan } from '../utils/progressCalc';
import { type DaySlotMapping } from '../utils/dateUtils';
import { DEFAULT_SCHEDULE_CONFIG, deriveScheduleConfigFromPlan, type ScheduleConfig } from '../utils/scheduleConfig';

interface State {
  studyPlan: StudyPlan | null;
  completions: Map<string, Completion>;
  subtaskCompletions: Map<string, SubtaskCompletion>;
  confusionLog: ConfusionEntry[];
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_NO_PLAN' }
  | { type: 'LOAD_DATA'; studyPlan: StudyPlan; completions: Completion[]; subtaskCompletions: SubtaskCompletion[]; confusionLog: ConfusionEntry[] }
  | { type: 'UPDATE_STUDY_PLAN'; studyPlan: StudyPlan }
  | { type: 'UPSERT_COMPLETION'; completion: Completion }
  | { type: 'REMOVE_COMPLETION'; slotId: string }
  | { type: 'UPSERT_SUBTASK'; subtask: SubtaskCompletion }
  | { type: 'ADD_CONFUSION'; entry: ConfusionEntry }
  | { type: 'UPDATE_CONFUSION'; entry: ConfusionEntry }
  | { type: 'REMOVE_CONFUSION'; id: string }
  | { type: 'SET_CONFUSION_LOG'; entries: ConfusionEntry[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    case 'SET_NO_PLAN':
      return { ...state, studyPlan: null, loading: false, error: null };
    case 'LOAD_DATA': {
      const map = new Map<string, Completion>();
      for (const c of action.completions) map.set(c.slot_id, c);
      const stMap = new Map<string, SubtaskCompletion>();
      for (const s of action.subtaskCompletions) stMap.set(s.subtask_id, s);
      return { ...state, studyPlan: action.studyPlan, completions: map, subtaskCompletions: stMap, confusionLog: action.confusionLog, loading: false };
    }
    case 'UPDATE_STUDY_PLAN':
      return { ...state, studyPlan: action.studyPlan };
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
    default:
      return state;
  }
}

interface ProgressContextValue {
  state: State;
  projectId: string;
  projectSlug: string;
  actualStartDate: string | null;
  studyPlan: StudyPlan;
  scheduleConfig: ScheduleConfig;
  dayMapping: DaySlotMapping;
  updateStudyPlan: (plan: StudyPlan) => Promise<void>;
  toggleCompletion: (slotId: string, completed: boolean) => Promise<void>;
  toggleSubtask: (subtaskId: string, completed: boolean, slotId: string, totalSubtasks: number) => Promise<void>;
  updateSlotNotes: (slotId: string, notes: string) => Promise<void>;
  updateSlotDifficulty: (slotId: string, difficulty: number | null) => Promise<void>;
  addConfusionEntry: (data: { topic: string; description: string; weekId: string }) => Promise<void>;
  updateConfusionEntry: (id: string, data: Partial<Pick<ConfusionEntry, 'topic' | 'description' | 'resolution' | 'resolved'>>) => Promise<void>;
  removeConfusionEntry: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

interface ProgressProviderProps {
  projectId: string;
  projectSlug: string;
  scheduleConfigJson: string | null;
  actualStartDate: string | null;
  children: ReactNode;
}

export function ProgressProvider({ projectId, projectSlug, scheduleConfigJson, actualStartDate, children }: ProgressProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    studyPlan: null,
    completions: new Map(),
    subtaskCompletions: new Map(),
    confusionLog: [],
    loading: true,
    error: null,
  });

  const loadData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      let studyPlan: Record<string, unknown> | null;
      try {
        studyPlan = await studyPlanApi(projectId).get();
      } catch {
        // 404 means no study plan exists yet
        studyPlan = null;
      }

      if (!studyPlan) {
        dispatch({ type: 'SET_NO_PLAN' });
        return;
      }

      const [completions, subtaskCompletions, confusionLog] = await Promise.all([
        completionsApi(projectId).getAll(),
        subtaskCompletionsApi(projectId).getAll(),
        confusionApi(projectId).getAll(),
      ]);
      dispatch({ type: 'LOAD_DATA', studyPlan: studyPlan as unknown as StudyPlan, completions, subtaskCompletions, confusionLog });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', error: (e as Error).message });
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleCompletion = useCallback(async (slotId: string, completed: boolean) => {
    const existing = state.completions.get(slotId);
    const result = await completionsApi(projectId).upsert(slotId, {
      completed: completed ? 1 : 0,
      notes: existing?.notes || '',
      difficulty: existing?.difficulty ?? null,
    });
    dispatch({ type: 'UPSERT_COMPLETION', completion: result });
  }, [state.completions, projectId]);

  const toggleSubtask = useCallback(async (subtaskId: string, completed: boolean, slotId: string, totalSubtasks: number) => {
    const result = await subtaskCompletionsApi(projectId).upsert(subtaskId, completed);
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
      const res = await completionsApi(projectId).upsert(slotId, {
        completed: 1,
        notes: existing?.notes || '',
        difficulty: existing?.difficulty ?? null,
      });
      dispatch({ type: 'UPSERT_COMPLETION', completion: res });
    } else if (!allDone && currentlyCompleted) {
      const res = await completionsApi(projectId).upsert(slotId, {
        completed: 0,
        notes: existing?.notes || '',
        difficulty: existing?.difficulty ?? null,
      });
      dispatch({ type: 'UPSERT_COMPLETION', completion: res });
    }
  }, [state.subtaskCompletions, state.completions, projectId]);

  const updateSlotNotes = useCallback(async (slotId: string, notes: string) => {
    const existing = state.completions.get(slotId);
    const result = await completionsApi(projectId).upsert(slotId, {
      completed: existing?.completed ?? 0,
      notes,
      difficulty: existing?.difficulty ?? null,
    });
    dispatch({ type: 'UPSERT_COMPLETION', completion: result });
  }, [state.completions, projectId]);

  const updateSlotDifficulty = useCallback(async (slotId: string, difficulty: number | null) => {
    const existing = state.completions.get(slotId);
    const result = await completionsApi(projectId).upsert(slotId, {
      completed: existing?.completed ?? 0,
      notes: existing?.notes || '',
      difficulty,
    });
    dispatch({ type: 'UPSERT_COMPLETION', completion: result });
  }, [state.completions, projectId]);

  const addConfusionEntry = useCallback(async (data: { topic: string; description: string; weekId: string }) => {
    const entry = await confusionApi(projectId).create(data);
    dispatch({ type: 'ADD_CONFUSION', entry });
  }, [projectId]);

  const updateConfusionEntry = useCallback(async (id: string, data: Partial<Pick<ConfusionEntry, 'topic' | 'description' | 'resolution' | 'resolved'>>) => {
    const entry = await confusionApi(projectId).update(id, data);
    dispatch({ type: 'UPDATE_CONFUSION', entry });
  }, [projectId]);

  const removeConfusionEntry = useCallback(async (id: string) => {
    await confusionApi(projectId).remove(id);
    dispatch({ type: 'REMOVE_CONFUSION', id });
  }, [projectId]);

  const updateStudyPlan = useCallback(async (plan: StudyPlan) => {
    const result = await studyPlanApi(projectId).update(plan as unknown as Record<string, unknown>);
    dispatch({ type: 'UPDATE_STUDY_PLAN', studyPlan: result as unknown as StudyPlan });
  }, [projectId]);

  // Derive schedule config: use saved config if available, otherwise auto-generate from the plan's slot types
  const scheduleConfig: ScheduleConfig = scheduleConfigJson
    ? JSON.parse(scheduleConfigJson)
    : state.studyPlan
      ? deriveScheduleConfigFromPlan(state.studyPlan.phases)
      : DEFAULT_SCHEDULE_CONFIG;

  const dayMapping: DaySlotMapping = scheduleConfig.dayMapping;

  // While loading or if no plan, provide a fallback study plan object
  const studyPlan: StudyPlan = state.studyPlan || { startDate: actualStartDate || '', endDate: '', totalWeeks: 0, schedule: { description: '', totalHoursPerWeek: 0, sessionStructures: {}, defaultDayMapping: {} }, resources: [], phases: [] };

  return (
    <ProgressContext.Provider
      value={{
        state,
        projectId,
        projectSlug,
        actualStartDate,
        studyPlan,
        scheduleConfig,
        dayMapping,
        updateStudyPlan,
        toggleCompletion,
        toggleSubtask,
        updateSlotNotes,
        updateSlotDifficulty,
        addConfusionEntry,
        updateConfusionEntry,
        removeConfusionEntry,
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

/** Returns the ProgressContext value or null if outside a ProgressProvider. */
export function useProgressOptional() {
  return useContext(ProgressContext);
}

export type { ProgressContextValue };
