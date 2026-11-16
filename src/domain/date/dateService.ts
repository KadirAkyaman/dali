import { format, parseISO, isBefore, isAfter, isSameDay, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Returns today's date in local calendar as 'YYYY-MM-DD'
 */
export function getTodayDateString(referenceDate: Date = new Date()): string {
  return format(referenceDate, 'yyyy-MM-dd');
}

/**
 * Checks if a given date string ('YYYY-MM-DD') is before today's date
 */
export function isPastDate(targetDate: string, today: string = getTodayDateString()): boolean {
  if (targetDate === today) return false;
  return isBefore(startOfDay(parseISO(targetDate)), startOfDay(parseISO(today)));
}

/**
 * Checks if a given date string is today
 */
export function isTodayDate(targetDate: string, today: string = getTodayDateString()): boolean {
  return targetDate === today || isSameDay(parseISO(targetDate), parseISO(today));
}

/**
 * Checks if a given date string is after today
 */
export function isFutureDate(targetDate: string, today: string = getTodayDateString()): boolean {
  if (targetDate === today) return false;
  return isAfter(startOfDay(parseISO(targetDate)), startOfDay(parseISO(today)));
}

/**
 * Formats a date string for display in Turkish (e.g. "12 Kasım 2026, Perşembe")
 */
export function formatDisplayDate(dateStr: string, includeYear: boolean = false): string {
  try {
    const d = parseISO(dateStr);
    const pattern = includeYear ? 'd MMMM yyyy, EEEE' : 'd MMMM, EEEE';
    return format(d, pattern, { locale: tr });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a short month/year display in Turkish (e.g. "Kasım 2026")
 */
export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: tr });
}
