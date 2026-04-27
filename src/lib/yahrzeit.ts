import { HDate, months } from '@hebcal/core';

export interface YahrzeitInfo {
  hebrew_date: string;
  next_gregorian: Date;
  days_until: number;
  hebrew_year: number;
}

// Hebrew month display names (order matches hebcal month numbers)
export const HEBREW_MONTHS = [
  { value: 1, label: 'Nisan' },
  { value: 2, label: 'Iyyar' },
  { value: 3, label: 'Sivan' },
  { value: 4, label: 'Tamuz' },
  { value: 5, label: 'Av' },
  { value: 6, label: 'Elul' },
  { value: 7, label: 'Tishrei' },
  { value: 8, label: 'Cheshvan' },
  { value: 9, label: 'Kislev' },
  { value: 10, label: 'Tevet' },
  { value: 11, label: 'Shvat' },
  { value: 12, label: 'Adar I' },
  { value: 13, label: 'Adar / Adar II' },
] as const;

export function hebrewMonthName(monthNum: number): string {
  return HEBREW_MONTHS.find((m) => m.value === monthNum)?.label ?? `Month ${monthNum}`;
}

export function formatHebrewDate(day: number, month: number): string {
  return `${day} ${hebrewMonthName(month)}`;
}

/**
 * Get today's Hebrew date string for display
 */
export function getTodayHebrewDate(): string {
  const today = new HDate();
  return today.render('en');
}

/**
 * Given a Hebrew day and month, calculate the next yahrzeit occurrence.
 * Handles Adar/leap year logic correctly:
 * - Month 13 (Adar II / Adar): In non-leap years maps to the single Adar.
 *   In leap years maps to Adar II.
 * - Month 12 (Adar I): In non-leap years maps to the single Adar.
 *   In leap years stays as Adar I.
 */
export function getNextYahrzeit(
  day: number,
  month: number
): YahrzeitInfo {
  const today = new HDate();
  const currentHebrewYear = today.getFullYear();

  function tryYear(year: number): HDate {
    const isLeap = HDate.isLeapYear(year);
    let effectiveMonth = month;

    // Handle Adar mapping
    if (month === 12 && !isLeap) {
      // Adar I in a non-leap year → use Adar (month 13 internally)
      effectiveMonth = 13;
    }
    // Month 13 in non-leap year: hebcal maps it to the single Adar automatically

    return new HDate(day, effectiveMonth, year);
  }

  // Try this year first
  let nextYahrzeit = tryYear(currentHebrewYear);
  let nextGregorian = nextYahrzeit.greg();

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // If already passed this year, get next year's
  if (nextGregorian < now) {
    nextYahrzeit = tryYear(currentHebrewYear + 1);
    nextGregorian = nextYahrzeit.greg();
  }

  const diff = nextGregorian.getTime() - now.getTime();
  const daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return {
    hebrew_date: formatHebrewDate(day, month),
    next_gregorian: nextGregorian,
    days_until: daysUntil,
    hebrew_year: nextYahrzeit.getFullYear(),
  };
}

/**
 * Legacy function: convert Gregorian death date to Hebrew day/month.
 * Used for migrating old records that only have Gregorian dates.
 */
export function gregorianToHebrewDayMonth(
  gregorianDate: string,
  isAfterSunset: boolean
): { day: number; month: number } {
  const d = new Date(gregorianDate);
  if (isAfterSunset) {
    d.setDate(d.getDate() + 1);
  }
  const hdate = new HDate(d);
  return { day: hdate.getDate(), month: hdate.getMonth() };
}

export function getUpcomingYahrzeits(
  familyMembers: Array<{
    id: string;
    name: string;
    hebrew_name: string | null;
    member_id: string;
    yahrzeit_day: number | null;
    yahrzeit_month: number | null;
    date_of_death_gregorian: string | null;
    is_after_sunset: boolean;
  }>,
  daysAhead: number = 7
): Array<{
  family_member_id: string;
  member_id: string;
  name: string;
  hebrew_name: string | null;
  yahrzeit: YahrzeitInfo;
}> {
  const results = [];

  for (const fm of familyMembers) {
    let day = fm.yahrzeit_day;
    let month = fm.yahrzeit_month;

    // Fallback: derive from Gregorian date if Hebrew fields not set
    if ((!day || !month) && fm.date_of_death_gregorian) {
      const derived = gregorianToHebrewDayMonth(
        fm.date_of_death_gregorian,
        fm.is_after_sunset
      );
      day = derived.day;
      month = derived.month;
    }

    if (!day || !month) continue;

    const yahrzeit = getNextYahrzeit(day, month);

    if (yahrzeit.days_until <= daysAhead && yahrzeit.days_until >= 0) {
      results.push({
        family_member_id: fm.id,
        member_id: fm.member_id,
        name: fm.name,
        hebrew_name: fm.hebrew_name,
        yahrzeit,
      });
    }
  }

  return results.sort((a, b) => a.yahrzeit.days_until - b.yahrzeit.days_until);
}
