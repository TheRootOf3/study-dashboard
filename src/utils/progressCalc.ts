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
  weekRange: number[];
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

export function getStreakDays(completions: Map<string, Completion>, _phases: Phase[]): number {
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

export interface TargetDataPoint {
  day: number;
  expected: number;
  actual: number | null;
  predicted: number | null;
  label: string;
}

/** Cumulative expected slots at end of a given day (0-indexed from plan start). */
function getExpectedSlotsAtDay(day: number, phases: Phase[]): number {
  // Each week is 7 days. By end of day D, weeks 1..floor(D/7)+1 should be done
  // but more precisely: target is linear across the total plan duration.
  const totalDays = phases.reduce((max, p) => Math.max(max, ...p.weeks.map(w => w.weekNumber)), 0) * 7;
  const totalSlots = phases.reduce((sum, p) => sum + p.weeks.reduce((s, w) => s + w.slots.length, 0), 0);
  return Math.round((day / totalDays) * totalSlots);
}

export function getExpectedSlotsAtWeek(weekNumber: number, phases: Phase[]): number {
  return getExpectedSlotsAtDay(weekNumber * 7, phases);
}

/** Total actually completed slots (all time, regardless of week assignment). */
function getTotalCompletedSlots(phases: Phase[], completions: Map<string, Completion>): number {
  let total = 0;
  for (const phase of phases) {
    for (const week of phase.weeks) {
      total += week.slots.filter(s => completions.get(s.id)?.completed).length;
    }
  }
  return total;
}

export function getActualSlotsAtWeek(weekNumber: number, phases: Phase[], completions: Map<string, Completion>): number {
  // For the chart we use total completed (not per-week cumulative), since
  // users can complete slots from any week at any time.
  // But we still clamp: can't show more than what exists up to that week.
  void weekNumber;
  return getTotalCompletedSlots(phases, completions);
}

export function getTargetChartData(
  currentDayInPlan: number,
  phases: Phase[],
  completions: Map<string, Completion>,
): TargetDataPoint[] {
  const totalWeeks = phases.reduce((max, p) => Math.max(max, ...p.weeks.map(w => w.weekNumber)), 0);
  const totalDays = totalWeeks * 7;
  const totalSlots = phases.reduce((sum, p) => sum + p.weeks.reduce((s, w) => s + w.slots.length, 0), 0);
  const points: TargetDataPoint[] = [];

  const actualNow = getTotalCompletedSlots(phases, completions);
  const ratePerDay = currentDayInPlan > 0 ? actualNow / currentDayInPlan : 0;

  // One data point per day, but label only week boundaries to avoid clutter
  for (let d = 0; d <= totalDays; d++) {
    const expected = getExpectedSlotsAtDay(d, phases);
    // For "actual" we only know the current total, not day-by-day history.
    // Show a straight line from 0 to actualNow up to today, then null.
    const actualAtDay = d <= currentDayInPlan
      ? Math.round(actualNow * (d / Math.max(currentDayInPlan, 1)))
      : null;
    const predicted = d >= currentDayInPlan
      ? Math.min(Math.round(actualNow + ratePerDay * (d - currentDayInPlan)), totalSlots)
      : null;

    const weekNum = Math.floor(d / 7) + 1;
    const dayInWeek = d % 7;
    const label = dayInWeek === 0 ? `Wk ${weekNum}` : '';

    points.push({ day: d, expected, actual: actualAtDay, predicted, label });
  }
  return points;
}

export type TargetStatus = 'ahead' | 'on-track' | 'behind';

export function getTargetStatus(
  currentWeekNumber: number,
  phases: Phase[],
  completions: Map<string, Completion>,
): { status: TargetStatus; expectedSlots: number; actualSlots: number; diff: number } {
  // Compare against PREVIOUS completed weeks only — don't penalise for the
  // current in-progress week.
  const compareWeek = Math.max(currentWeekNumber - 1, 0);
  const expectedSlots = getExpectedSlotsAtWeek(compareWeek, phases);
  const actualSlots = getTotalCompletedSlots(phases, completions);
  const diff = actualSlots - expectedSlots;

  // In week 1 (no previous weeks), you're always on-track
  if (currentWeekNumber <= 1) {
    return { status: 'on-track', expectedSlots: 0, actualSlots, diff: actualSlots };
  }

  const threshold = Math.max(2, Math.round(expectedSlots * 0.05));
  let status: TargetStatus;
  if (diff >= threshold) status = 'ahead';
  else if (diff > -threshold) status = 'on-track';
  else status = 'behind';
  return { status, expectedSlots, actualSlots, diff };
}

export function getProjectedCompletionWeek(
  currentWeekNumber: number,
  phases: Phase[],
  completions: Map<string, Completion>,
): number | null {
  const actualSlots = getTotalCompletedSlots(phases, completions);
  if (actualSlots === 0 || currentWeekNumber === 0) return null;
  const totalSlots = getOverallProgress(phases, completions).total;
  const ratePerWeek = actualSlots / currentWeekNumber;
  return Math.ceil(totalSlots / ratePerWeek);
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
