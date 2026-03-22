import { useMemo } from 'react';
import { useProgress } from '../context/ProgressContext';
import { getCurrentWeekNumber } from '../utils/dateUtils';
import { getWeekByNumber, getPhaseForWeek } from '../utils/progressCalc';

export function useCurrentWeek() {
  const { state, studyPlan } = useProgress();

  return useMemo(() => {
    const weekNumber = getCurrentWeekNumber(state.settings.actual_start_date);
    const week = getWeekByNumber(weekNumber, studyPlan.phases);
    const phase = getPhaseForWeek(weekNumber, studyPlan.phases);
    return { weekNumber, week, phase };
  }, [state.settings.actual_start_date, studyPlan.phases]);
}
