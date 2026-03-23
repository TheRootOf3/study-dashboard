const BASE = '/api';

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

// Completions
export interface Completion {
  slot_id: string;
  completed: number;
  completed_at: string | null;
  notes: string;
  difficulty: number | null;
}

export const completionsApi = {
  getAll: () => request<Completion[]>('/completions'),
  upsert: (slotId: string, data: { completed: number; notes?: string; difficulty?: number | null }) =>
    request<Completion>(`/completions/${encodeURIComponent(slotId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (slotId: string) =>
    request<void>(`/completions/${encodeURIComponent(slotId)}`, { method: 'DELETE' }),
};

// Confusion Log
export interface ConfusionEntry {
  id: string;
  created_at: string;
  topic: string;
  description: string;
  resolution: string;
  resolved: number;
  week_id: string;
}

export const confusionApi = {
  getAll: (params?: { resolved?: boolean; weekId?: string }) => {
    const sp = new URLSearchParams();
    if (params?.resolved !== undefined) sp.set('resolved', String(params.resolved));
    if (params?.weekId) sp.set('weekId', params.weekId);
    const qs = sp.toString();
    return request<ConfusionEntry[]>(`/confusion-log${qs ? `?${qs}` : ''}`);
  },
  create: (data: { topic: string; description: string; weekId: string }) =>
    request<ConfusionEntry>('/confusion-log', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Pick<ConfusionEntry, 'topic' | 'description' | 'resolution' | 'resolved'>>) =>
    request<ConfusionEntry>(`/confusion-log/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<void>(`/confusion-log/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// Week Notes
export interface WeekNote {
  week_id: string;
  notes: string;
}

export const weekNotesApi = {
  get: (weekId: string) => request<WeekNote>(`/week-notes/${encodeURIComponent(weekId)}`),
  upsert: (weekId: string, notes: string) =>
    request<WeekNote>(`/week-notes/${encodeURIComponent(weekId)}`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),
};

// Settings
export interface Settings {
  actual_start_date: string | null;
  theme: string;
  day_mapping: string | null;
  schedule_config: string | null;
}

export const settingsApi = {
  get: () => request<Settings>('/settings'),
  update: (data: Partial<Settings>) =>
    request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

// Subtask Completions
export interface SubtaskCompletion {
  subtask_id: string;
  completed: number;
  completed_at: string | null;
}

export const subtaskCompletionsApi = {
  getAll: () => request<SubtaskCompletion[]>('/subtask-completions'),
  upsert: (subtaskId: string, completed: boolean) =>
    request<SubtaskCompletion>(`/subtask-completions/${encodeURIComponent(subtaskId)}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    }),
};

// Backup
export const backupApi = {
  exportData: () => request<Record<string, unknown[]>>('/backup'),
  importData: (data: Record<string, unknown[]>) =>
    request<{ success: boolean }>('/backup', { method: 'POST', body: JSON.stringify(data) }),
};
