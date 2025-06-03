import { VacationPost } from '@/types/database';
import { isWithinInterval, parseISO } from 'date-fns';

interface DateConflict {
  vacationId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  overlapType: 'partial' | 'complete';
}

export const checkDateConflicts = (
  vacation: VacationPost,
  existingVacations: VacationPost[]
): DateConflict[] => {
  const newVacationStart = parseISO(vacation.start_date);
  const newVacationEnd = parseISO(vacation.end_date);
  const conflicts: DateConflict[] = [];

  existingVacations.forEach(existingVacation => {
    if (existingVacation.id === vacation.id) return; // Skip the same vacation

    const existingStart = parseISO(existingVacation.start_date);
    const existingEnd = parseISO(existingVacation.end_date);

    // Check for complete overlap
    if (
      newVacationStart <= existingStart &&
      newVacationEnd >= existingEnd
    ) {
      conflicts.push({
        vacationId: existingVacation.id,
        title: existingVacation.title,
        startDate: existingStart,
        endDate: existingEnd,
        overlapType: 'complete'
      });
    }
    // Check for partial overlap
    else if (
      isWithinInterval(newVacationStart, { start: existingStart, end: existingEnd }) ||
      isWithinInterval(newVacationEnd, { start: existingStart, end: existingEnd }) ||
      isWithinInterval(existingStart, { start: newVacationStart, end: newVacationEnd }) ||
      isWithinInterval(existingEnd, { start: newVacationStart, end: newVacationEnd })
    ) {
      conflicts.push({
        vacationId: existingVacation.id,
        title: existingVacation.title,
        startDate: existingStart,
        endDate: existingEnd,
        overlapType: 'partial'
      });
    }
  });

  return conflicts;
};

export const getConflictMessage = (conflicts: DateConflict[]): string => {
  if (conflicts.length === 0) return '';

  const conflictDetails = conflicts.map(conflict => {
    const type = conflict.overlapType === 'complete' ? 'completement' : 'partiellement';
    return `- "${conflict.title}" (${type} chevauchant)`;
  }).join('\n');

  return `Attention : Cette vacation chevauche ${conflicts.length} autre(s) vacation(s) :\n${conflictDetails}`;
};

export const validateVacationDates = (
  startDate: string,
  endDate: string,
  existingVacations: VacationPost[]
): { isValid: boolean; conflicts: DateConflict[] } => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  // Check if end date is after start date
  if (end <= start) {
    return {
      isValid: false,
      conflicts: []
    };
  }

  // Check for conflicts with existing vacations
  const conflicts = checkDateConflicts(
    { start_date: startDate, end_date: endDate } as VacationPost,
    existingVacations
  );

  return {
    isValid: conflicts.length === 0,
    conflicts
  };
}; 