import { useMemo } from 'react';
import { useProgress } from '../context/ProgressContext';
import { getCurrentWeekNumber } from '../utils/dateUtils';
import { getWeekByNumber, getPhaseForWeek } from '../utils/progressCalc';

export function useCurrentWeek() {
  const { actualStartDate, studyPlan } = useProgress();

  return useMemo(() => {
    const weekNumber = getCurrentWeekNumber(actualStartDate);
    const week = getWeekByNumber(weekNumber, studyPlan.phases);
    const phase = getPhaseForWeek(weekNumber, studyPlan.phases);
    return { weekNumber, week, phase };
  }, [actualStartDate, studyPlan.phases]);
}
