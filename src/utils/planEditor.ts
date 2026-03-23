import type { StudyPlan, Slot } from './progressCalc';

/** Fields that represent the "content" of a slot (swappable between slots). */
type SlotContent = Pick<Slot, 'description' | 'subtasks' | 'links' | 'tags' | 'isAdditionalContent' | 'estimatedMinutes'>;

/**
 * Swap the content fields between two slots, keeping id/type/slotNumber/label in place.
 * Mutates both slots in-place for convenience; callers should work on a deep copy of the plan.
 */
export function swapSlotContent(a: Slot, b: Slot): void {
  const fields: (keyof SlotContent)[] = ['description', 'subtasks', 'links', 'tags', 'isAdditionalContent', 'estimatedMinutes'];
  for (const key of fields) {
    const tmp = a[key];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a as any)[key] = b[key];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (b as any)[key] = tmp;
  }
}

/**
 * Return a deep copy of `plan` with the specified slot in `weekNumber` updated
 * with the fields in `updates`.
 */
export function updateSlotInPlan(
  plan: StudyPlan,
  weekNumber: number,
  slotId: string,
  updates: Partial<Pick<Slot, 'description' | 'subtasks' | 'links' | 'tags' | 'isAdditionalContent' | 'estimatedMinutes'>>,
): StudyPlan {
  const copy: StudyPlan = JSON.parse(JSON.stringify(plan));
  for (const phase of copy.phases) {
    for (const week of phase.weeks) {
      if (week.weekNumber !== weekNumber) continue;
      const slot = week.slots.find(s => s.id === slotId);
      if (slot) {
        Object.assign(slot, updates);
        return copy;
      }
    }
  }
  return copy;
}

/**
 * Return a deep copy of `plan` with two slots' content swapped (reorder within a week).
 */
export function reorderSlotInPlan(
  plan: StudyPlan,
  weekNumber: number,
  slotIdA: string,
  slotIdB: string,
): StudyPlan {
  const copy: StudyPlan = JSON.parse(JSON.stringify(plan));
  for (const phase of copy.phases) {
    for (const week of phase.weeks) {
      if (week.weekNumber !== weekNumber) continue;
      const a = week.slots.find(s => s.id === slotIdA);
      const b = week.slots.find(s => s.id === slotIdB);
      if (a && b) {
        swapSlotContent(a, b);
      }
      return copy;
    }
  }
  return copy;
}

/**
 * Return a deep copy of `plan` with the content of `sourceSlotId` (in `sourceWeek`)
 * swapped into the matching-position slot in `targetWeek`.
 *
 * "Matching position" = same type and slotNumber (e.g. train-1 -> train-1).
 * If no matching slot exists in the target week, falls back to the first slot of the
 * same type, or the first slot overall.
 */
export function moveSlotToWeek(
  plan: StudyPlan,
  sourceWeekNumber: number,
  targetWeekNumber: number,
  sourceSlotId: string,
): StudyPlan {
  const copy: StudyPlan = JSON.parse(JSON.stringify(plan));

  let sourceSlot: Slot | undefined;
  let targetSlot: Slot | undefined;

  // Find source slot
  for (const phase of copy.phases) {
    for (const week of phase.weeks) {
      if (week.weekNumber === sourceWeekNumber) {
        sourceSlot = week.slots.find(s => s.id === sourceSlotId);
      }
    }
  }
  if (!sourceSlot) return copy;

  // Find target slot: match by type + slotNumber first
  for (const phase of copy.phases) {
    for (const week of phase.weeks) {
      if (week.weekNumber === targetWeekNumber) {
        targetSlot = week.slots.find(s => s.type === sourceSlot!.type && s.slotNumber === sourceSlot!.slotNumber);
        if (!targetSlot) {
          targetSlot = week.slots.find(s => s.type === sourceSlot!.type);
        }
        if (!targetSlot && week.slots.length > 0) {
          targetSlot = week.slots[0];
        }
      }
    }
  }

  if (targetSlot && sourceSlot) {
    swapSlotContent(sourceSlot, targetSlot);
  }

  return copy;
}

/**
 * Collect all weeks from a plan, returning a flat list of { weekNumber, title }.
 */
export function getAllWeeks(plan: StudyPlan): { weekNumber: number; title: string }[] {
  const weeks: { weekNumber: number; title: string }[] = [];
  for (const phase of plan.phases) {
    for (const week of phase.weeks) {
      weeks.push({ weekNumber: week.weekNumber, title: week.title });
    }
  }
  weeks.sort((a, b) => a.weekNumber - b.weekNumber);
  return weeks;
}
