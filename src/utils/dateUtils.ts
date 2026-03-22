import { addDays, differenceInDays, differenceInWeeks, format, isWithinInterval, parseISO, startOfDay, isBefore, isAfter, startOfWeek, endOfWeek, eachDayOfInterval, getDay } from 'date-fns';

const PLAN_START = '2026-03-24';
const TOTAL_WEEKS = 31;

export function getPlanStartDate(actualStartDate?: string | null): Date {
  return parseISO(actualStartDate || PLAN_START);
}

export function getWeekStartDate(weekNumber: number, actualStartDate?: string | null): Date {
  const start = getPlanStartDate(actualStartDate);
  return addDays(start, (weekNumber - 1) * 7);
}

export function getWeekEndDate(weekNumber: number, actualStartDate?: string | null): Date {
  return addDays(getWeekStartDate(weekNumber, actualStartDate), 6);
}

export function getCurrentDayInPlan(actualStartDate?: string | null): number {
  const start = getPlanStartDate(actualStartDate);
  const today = startOfDay(new Date());
  if (isBefore(today, start)) return 0;
  return Math.min(differenceInDays(today, start), TOTAL_WEEKS * 7);
}

export function getCurrentWeekNumber(actualStartDate?: string | null): number {
  const start = getPlanStartDate(actualStartDate);
  const today = startOfDay(new Date());
  if (isBefore(today, start)) return 1;
  const weeksSince = differenceInWeeks(today, start);
  return Math.min(weeksSince + 1, TOTAL_WEEKS);
}

export function isCurrentWeek(weekNumber: number, actualStartDate?: string | null): boolean {
  return getCurrentWeekNumber(actualStartDate) === weekNumber;
}

export function isToday(date: Date): boolean {
  const today = startOfDay(new Date());
  const d = startOfDay(date);
  return differenceInDays(today, d) === 0;
}

export function isPastWeek(weekNumber: number, actualStartDate?: string | null): boolean {
  return weekNumber < getCurrentWeekNumber(actualStartDate);
}

export function isFutureWeek(weekNumber: number, actualStartDate?: string | null): boolean {
  return weekNumber > getCurrentWeekNumber(actualStartDate);
}

export function getTimeProgress(actualStartDate?: string | null): number {
  const start = getPlanStartDate(actualStartDate);
  const end = addDays(start, TOTAL_WEEKS * 7);
  const today = new Date();
  if (isBefore(today, start)) return 0;
  if (isAfter(today, end)) return 100;
  const totalDays = differenceInDays(end, start);
  const elapsedDays = differenceInDays(today, start);
  return Math.round((elapsedDays / totalDays) * 100);
}

export function formatDateRange(weekNumber: number, actualStartDate?: string | null): string {
  const start = getWeekStartDate(weekNumber, actualStartDate);
  const end = getWeekEndDate(weekNumber, actualStartDate);
  return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`;
}

export function formatRelativeTime(isoDate: string): string {
  const date = parseISO(isoDate);
  const now = new Date();
  const days = differenceInDays(now, date);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  return `${weeks} weeks ago`;
}

export type DaySlotMapping = Record<string, string[]>;

export const DEFAULT_DAY_MAPPING: DaySlotMapping = {
  monday: ['train-1'],
  tuesday: ['train-2', 'evening-1'],
  wednesday: ['train-3'],
  thursday: ['train-4', 'evening-2'],
  friday: [],
  saturday: ['evening-3'],
  sunday: [],
};

const DAY_INDEX_TO_NAME: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

export function getTodaySlotTypes(dayMapping?: DaySlotMapping | null): string[] {
  const mapping = dayMapping || DEFAULT_DAY_MAPPING;
  const dayName = DAY_INDEX_TO_NAME[getDay(new Date())];
  return mapping[dayName] || [];
}

export function getDaySlotTypes(date: Date, dayMapping?: DaySlotMapping | null): string[] {
  const mapping = dayMapping || DEFAULT_DAY_MAPPING;
  const dayName = DAY_INDEX_TO_NAME[getDay(date)];
  return mapping[dayName] || [];
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfWeek(new Date(year, month, 1), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(year, month + 1, 0), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getWeekNumberForDate(date: Date, actualStartDate?: string | null): number | null {
  const start = getPlanStartDate(actualStartDate);
  const end = addDays(start, TOTAL_WEEKS * 7 - 1);
  if (isBefore(date, start) || isAfter(date, end)) return null;
  return Math.floor(differenceInDays(date, start) / 7) + 1;
}

export function isDayWithinWeek(date: Date, weekNumber: number, actualStartDate?: string | null): boolean {
  const weekStart = getWeekStartDate(weekNumber, actualStartDate);
  const weekEnd = getWeekEndDate(weekNumber, actualStartDate);
  return isWithinInterval(date, { start: weekStart, end: weekEnd });
}
