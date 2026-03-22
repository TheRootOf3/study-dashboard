import type { Completion } from '../api/client';

export interface StudyPlan {
  startDate: string;
  endDate: string;
  totalWeeks: number;
  schedule: {
    description: string;
    totalHoursPerWeek: number;
    sessionStructures: Record<string, unknown>;
    defaultDayMapping: Record<string, string[]>;
  };
  resources: Resource[];
  phases: Phase[];
}

export interface Phase {
  id: string;
  number: number;
  title: string;
  course: string;
  courseUrl: string;
  description: string;
  bookChapters: string;
  bookDescription: string;
  weekRange: [number, number];
  completionNote: string;
  weeks: Week[];
}

export interface Week {
  id: string;
  weekNumber: number;
  dateRange: string;
  startDate: string;
  endDate: string;
  title: string;
  isBuffer: boolean;
  slots: Slot[];
}

export interface Subtask {
  id: string;
  label: string;
}

export interface Slot {
  id: string;
  type: 'train' | 'evening';
  slotNumber: number;
  label: string;
  description: string;
  isBookSlot: boolean;
  estimatedMinutes: number;
  tags: string[];
  links: SlotLink[];
  subtasks: Subtask[];
}

export interface SlotLink {
  text: string;
  url: string;
}

export interface Resource {
  name: string;
  url: string;
  category: 'course' | 'book' | 'video' | 'paper' | 'reference';
  phases: number[];
}

export function getWeekProgress(week: Week, completions: Map<string, Completion>): { completed: number; total: number; percent: number } {
  const total = week.slots.length;
  const completed = week.slots.filter(s => completions.get(s.id)?.completed).length;
  return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

export function getPhaseProgress(phase: Phase, completions: Map<string, Completion>): { completed: number; total: number; percent: number } {
  let completed = 0;
  let total = 0;
  for (const week of phase.weeks) {
    const wp = getWeekProgress(week, completions);
    completed += wp.completed;
    total += wp.total;
  }
  return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

export function getOverallProgress(phases: Phase[], completions: Map<string, Completion>): { completed: number; total: number; percent: number } {
  let completed = 0;
  let total = 0;
  for (const phase of phases) {
    const pp = getPhaseProgress(phase, completions);
    completed += pp.completed;
    total += pp.total;
  }
  return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

export function getWeekHours(week: Week, completions: Map<string, Completion>): { completed: number; total: number } {
  let completedMins = 0;
  let totalMins = 0;
  for (const slot of week.slots) {
    totalMins += slot.estimatedMinutes;
    if (completions.get(slot.id)?.completed) {
      completedMins += slot.estimatedMinutes;
    }
  }
  return { completed: Math.round(completedMins / 60 * 10) / 10, total: Math.round(totalMins / 60 * 10) / 10 };
}

export function getPhaseForWeek(weekNumber: number, phases: Phase[]): Phase | undefined {
  return phases.find(p => weekNumber >= p.weekRange[0] && weekNumber <= p.weekRange[1]);
}

export function getWeekByNumber(weekNumber: number, phases: Phase[]): Week | undefined {
  for (const phase of phases) {
    const week = phase.weeks.find(w => w.weekNumber === weekNumber);
    if (week) return week;
  }
  return undefined;
}

export function getStreakDays(completions: Map<string, Completion>, phases: Phase[]): number {
  // Count consecutive days (backwards from today) where at least one scheduled slot was completed
  const allCompletedDates = new Set<string>();
  for (const [, c] of completions) {
    if (c.completed && c.completed_at) {
      const dateStr = c.completed_at.split('T')[0];
      allCompletedDates.add(dateStr);
    }
  }

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (allCompletedDates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      // Check if this was a rest day (no slots scheduled)
      // For simplicity, just check if it's a day with no scheduled slots
      // based on the default mapping (Friday and Sunday)
      const dayOfWeek = d.getDay();
      const isRestDay = dayOfWeek === 0 || dayOfWeek === 5; // Sunday=0, Friday=5
      if (isRestDay) {
        continue; // Rest days don't break the streak
      }
      break;
    } else {
      // Today - if nothing done yet today, check yesterday
      continue;
    }
  }
  return streak;
}

export function getPhaseColor(phaseNumber: number): string {
  const colors: Record<number, string> = {
    1: 'var(--color-phase-1)',
    2: 'var(--color-phase-2)',
    3: 'var(--color-phase-3)',
    4: 'var(--color-phase-4)',
    5: 'var(--color-phase-5)',
  };
  return colors[phaseNumber] || 'var(--color-text-tertiary)';
}
