export interface SessionType {
  id: string;
  label: string;
  icon: string;
}

export interface SlotDefinition {
  key: string;          // internal key, e.g. "train-1" or "custom-1"
  typeId: string;       // references a SessionType.id
  label: string;        // display name, e.g. "Commute 1", "Extra Review"
  isCustom: boolean;    // true for user-added slots not in the study plan
}

export interface ScheduleConfig {
  sessionTypes: SessionType[];
  slots: SlotDefinition[];                  // ordered list of all slots per week
  dayMapping: Record<string, string[]>;     // day name -> slot keys
}

export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  sessionTypes: [
    { id: 'commute', label: 'Commute', icon: 'train' },
    { id: 'evening', label: 'Evening', icon: 'moon' },
  ],
  slots: [
    { key: 'train-1',   typeId: 'commute', label: 'Commute 1', isCustom: false },
    { key: 'train-2',   typeId: 'commute', label: 'Commute 2', isCustom: false },
    { key: 'train-3',   typeId: 'commute', label: 'Commute 3', isCustom: false },
    { key: 'train-4',   typeId: 'commute', label: 'Commute 4', isCustom: false },
    { key: 'evening-1', typeId: 'evening', label: 'Evening 1',  isCustom: false },
    { key: 'evening-2', typeId: 'evening', label: 'Evening 2',  isCustom: false },
    { key: 'evening-3', typeId: 'evening', label: 'Evening 3',  isCustom: false },
  ],
  dayMapping: {
    monday:    ['train-1'],
    tuesday:   ['train-2', 'evening-1'],
    wednesday: ['train-3'],
    thursday:  ['train-4', 'evening-2'],
    friday:    [],
    saturday:  ['evening-3'],
    sunday:    [],
  },
};

export const SCHEDULE_PRESETS: Record<string, { name: string; description: string; config: ScheduleConfig }> = {
  commuter: {
    name: 'Commuter',
    description: '4 commute sessions + 3 evenings',
    config: DEFAULT_SCHEDULE_CONFIG,
  },
  'evenings-only': {
    name: 'Evenings Only',
    description: 'All sessions in the evening',
    config: {
      sessionTypes: [
        { id: 'study', label: 'Study Block', icon: 'book-open' },
        { id: 'practice', label: 'Practice', icon: 'pencil-line' },
      ],
      slots: [
        { key: 'train-1',   typeId: 'study',    label: 'Study 1',    isCustom: false },
        { key: 'train-2',   typeId: 'study',    label: 'Study 2',    isCustom: false },
        { key: 'train-3',   typeId: 'study',    label: 'Study 3',    isCustom: false },
        { key: 'train-4',   typeId: 'study',    label: 'Study 4',    isCustom: false },
        { key: 'evening-1', typeId: 'practice', label: 'Practice 1', isCustom: false },
        { key: 'evening-2', typeId: 'practice', label: 'Practice 2', isCustom: false },
        { key: 'evening-3', typeId: 'practice', label: 'Practice 3', isCustom: false },
      ],
      dayMapping: {
        monday: ['train-1', 'evening-1'], tuesday: ['train-2'],
        wednesday: ['train-3', 'evening-2'], thursday: ['train-4'],
        friday: ['evening-3'], saturday: [], sunday: [],
      },
    },
  },
  'daily-blocks': {
    name: 'Daily Blocks',
    description: 'One session per day',
    config: {
      sessionTypes: [{ id: 'block', label: 'Study', icon: 'book-open' }],
      slots: [
        { key: 'train-1',   typeId: 'block', label: 'Day 1', isCustom: false },
        { key: 'train-2',   typeId: 'block', label: 'Day 2', isCustom: false },
        { key: 'train-3',   typeId: 'block', label: 'Day 3', isCustom: false },
        { key: 'train-4',   typeId: 'block', label: 'Day 4', isCustom: false },
        { key: 'evening-1', typeId: 'block', label: 'Day 5', isCustom: false },
        { key: 'evening-2', typeId: 'block', label: 'Day 6', isCustom: false },
        { key: 'evening-3', typeId: 'block', label: 'Day 7', isCustom: false },
      ],
      dayMapping: {
        monday: ['train-1'], tuesday: ['train-2'], wednesday: ['train-3'],
        thursday: ['train-4'], friday: ['evening-1'], saturday: ['evening-2'],
        sunday: ['evening-3'],
      },
    },
  },
};

/** Get the display info for a slot given its key */
export function getSlotDisplay(slotKey: string, config: ScheduleConfig): { label: string; icon: string; typeId: string } {
  const def = config.slots.find(s => s.key === slotKey);
  if (!def) return { label: slotKey, icon: 'circle', typeId: '' };
  const st = config.sessionTypes.find(t => t.id === def.typeId);
  return { label: def.label, icon: st?.icon || 'circle', typeId: def.typeId };
}

/** Get the label for a study plan Slot object */
export function getSlotLabel(slot: { type: string; slotNumber: number }, config: ScheduleConfig): string {
  const key = `${slot.type}-${slot.slotNumber}`;
  return getSlotDisplay(key, config).label;
}

/** Group slots by their session type ID */
export function groupSlotsByType<T extends { type: string; slotNumber: number }>(
  slots: T[],
  config: ScheduleConfig,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const slot of slots) {
    const key = `${slot.type}-${slot.slotNumber}`;
    const def = config.slots.find(s => s.key === key);
    // Fall back to the slot's own type field if config doesn't know this slot
    const typeId = def?.typeId || slot.type;
    if (!groups.has(typeId)) groups.set(typeId, []);
    groups.get(typeId)!.push(slot);
  }
  return groups;
}

/** Get all slot keys from config */
export function getAllSlotKeys(config: ScheduleConfig): string[] {
  return config.slots.map(s => s.key);
}

/** Get only custom slot keys */
export function getCustomSlotKeys(config: ScheduleConfig): string[] {
  return config.slots.filter(s => s.isCustom).map(s => s.key);
}

/** Generate a unique key for a new custom slot */
export function nextCustomSlotKey(config: ScheduleConfig): string {
  const existing = config.slots.filter(s => s.isCustom).map(s => {
    const m = s.key.match(/^custom-(\d+)$/);
    return m ? parseInt(m[1]) : 0;
  });
  const max = existing.length > 0 ? Math.max(...existing) : 0;
  return `custom-${max + 1}`;
}

/** Default icon guesses for common slot type names */
const TYPE_ICON_HINTS: Record<string, string> = {
  lecture: 'graduation-cap',
  practice: 'pencil-line',
  reading: 'book-open',
  review: 'book-open',
  exercise: 'pencil-line',
  session: 'book-open',
  train: 'train',
  evening: 'moon',
  commute: 'train',
  study: 'book-open',
  deep: 'graduation-cap',
  light: 'pencil-line',
};

/**
 * Auto-generate a ScheduleConfig from a study plan's slot types.
 * Scans all weeks to discover unique slot types and slot keys,
 * then creates session types and slot definitions.
 */
export function deriveScheduleConfigFromPlan(phases: { weeks: { slots: { type: string; slotNumber: number; label: string }[] }[] }[]): ScheduleConfig {
  const typeSet = new Map<string, number>(); // type -> max slotNumber
  const slotKeys: string[] = [];
  const seenKeys = new Set<string>();

  for (const phase of phases) {
    for (const week of phase.weeks) {
      for (const slot of week.slots) {
        const key = `${slot.type}-${slot.slotNumber}`;
        const prev = typeSet.get(slot.type) || 0;
        typeSet.set(slot.type, Math.max(prev, slot.slotNumber));
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          slotKeys.push(key);
        }
      }
    }
  }

  const sessionTypes: SessionType[] = Array.from(typeSet.keys()).map(type => ({
    id: type,
    label: type.charAt(0).toUpperCase() + type.slice(1),
    icon: TYPE_ICON_HINTS[type.toLowerCase()] || 'circle',
  }));

  const slots: SlotDefinition[] = slotKeys.map(key => {
    const [type, numStr] = key.split('-');
    const st = sessionTypes.find(t => t.id === type);
    return {
      key,
      typeId: type,
      label: `${st?.label || type} ${numStr}`,
      isCustom: false,
    };
  });

  // Simple day mapping: spread slots across weekdays
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayMapping: Record<string, string[]> = {};
  for (const d of days) dayMapping[d] = [];
  slots.forEach((s, i) => {
    const dayIdx = i % 5; // spread across Mon-Fri by default
    dayMapping[days[dayIdx]].push(s.key);
  });

  return { sessionTypes, slots, dayMapping };
}
