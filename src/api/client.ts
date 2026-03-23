const BASE = '/api';
const enc = encodeURIComponent;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ── Projects ──────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  slug: string;
  color: string;
  actual_start_date: string | null;
  schedule_config: string | null;
  created_at: string;
  sort_order: number;
}

export const projectsApi = {
  list: () => request<Project[]>('/projects'),
  create: (data: { name: string; color?: string }) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Project>) =>
    request<Project>(`/projects/${enc(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) =>
    request<void>(`/projects/${enc(id)}`, { method: 'DELETE' }),
};

// ── Global Settings ───────────────────────────────────────────────────

export interface GlobalSettings {
  theme: string;
}

export const globalSettingsApi = {
  get: () => request<GlobalSettings>('/global-settings'),
  update: (data: Partial<GlobalSettings>) =>
    request<GlobalSettings>('/global-settings', { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Completions (per-project) ─────────────────────────────────────────

export interface Completion {
  slot_id: string;
  completed: number;
  completed_at: string | null;
  notes: string;
  difficulty: number | null;
}

export function completionsApi(projectId: string) {
  const base = `/projects/${enc(projectId)}/completions`;
  return {
    getAll: () => request<Completion[]>(base),
    upsert: (slotId: string, data: { completed: number; notes?: string; difficulty?: number | null }) =>
      request<Completion>(`${base}/${enc(slotId)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    remove: (slotId: string) =>
      request<void>(`${base}/${enc(slotId)}`, { method: 'DELETE' }),
  };
}

// ── Confusion Log (per-project) ───────────────────────────────────────

export interface ConfusionEntry {
  id: string;
  created_at: string;
  topic: string;
  description: string;
  resolution: string;
  resolved: number;
  week_id: string;
}

export function confusionApi(projectId: string) {
  const base = `/projects/${enc(projectId)}/confusion-log`;
  return {
    getAll: (params?: { resolved?: boolean; weekId?: string }) => {
      const sp = new URLSearchParams();
      if (params?.resolved !== undefined) sp.set('resolved', String(params.resolved));
      if (params?.weekId) sp.set('weekId', params.weekId);
      const qs = sp.toString();
      return request<ConfusionEntry[]>(`${base}${qs ? `?${qs}` : ''}`);
    },
    create: (data: { topic: string; description: string; weekId: string }) =>
      request<ConfusionEntry>(base, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Pick<ConfusionEntry, 'topic' | 'description' | 'resolution' | 'resolved'>>) =>
      request<ConfusionEntry>(`${base}/${enc(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      request<void>(`${base}/${enc(id)}`, { method: 'DELETE' }),
  };
}

// ── Week Notes (per-project) ──────────────────────────────────────────

export interface WeekNote {
  week_id: string;
  notes: string;
}

export function weekNotesApi(projectId: string) {
  const base = `/projects/${enc(projectId)}/week-notes`;
  return {
    get: (weekId: string) => request<WeekNote>(`${base}/${enc(weekId)}`),
    upsert: (weekId: string, notes: string) =>
      request<WeekNote>(`${base}/${enc(weekId)}`, {
        method: 'PUT',
        body: JSON.stringify({ notes }),
      }),
  };
}

// ── Subtask Completions (per-project) ─────────────────────────────────

export interface SubtaskCompletion {
  subtask_id: string;
  completed: number;
  completed_at: string | null;
}

export function subtaskCompletionsApi(projectId: string) {
  const base = `/projects/${enc(projectId)}/subtask-completions`;
  return {
    getAll: () => request<SubtaskCompletion[]>(base),
    upsert: (subtaskId: string, completed: boolean) =>
      request<SubtaskCompletion>(`${base}/${enc(subtaskId)}`, {
        method: 'PUT',
        body: JSON.stringify({ completed }),
      }),
  };
}

// ── Study Plan (per-project) ──────────────────────────────────────────

export function studyPlanApi(projectId: string) {
  const base = `/projects/${enc(projectId)}/study-plan`;
  return {
    get: () => request<Record<string, unknown>>(base),
    update: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>(base, { method: 'PUT', body: JSON.stringify(data) }),
  };
}

// ── Backup (global) ───────────────────────────────────────────────────

export const backupApi = {
  exportData: () => request<Record<string, unknown[]>>('/backup'),
  importData: (data: Record<string, unknown[]>) =>
    request<{ success: boolean }>('/backup', { method: 'POST', body: JSON.stringify(data) }),
};
