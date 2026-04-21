import { HDate, months } from '@hebcal/core';

export interface YahrzeitInfo {
  hebrew_date: string;
  next_gregorian: Date;
  days_until: number;
  hebrew_year: number;
}

export function getHebrewDateOfDeath(
  gregorianDate: string,
  isAfterSunset: boolean
): HDate {
  const d = new Date(gregorianDate);
  // If the death occurred after sunset, the Hebrew date is the next day
  if (isAfterSunset) {
    d.setDate(d.getDate() + 1);
  }
  return new HDate(d);
}

export function formatHebrewDate(hdate: HDate): string {
  return hdate.render('en');
}

export function getNextYahrzeit(
  gregorianDateOfDeath: string,
  isAfterSunset: boolean
): YahrzeitInfo {
  const hdate = getHebrewDateOfDeath(gregorianDateOfDeath, isAfterSunset);
  const today = new HDate();
  const currentHebrewYear = today.getFullYear();

  // Try this year's yahrzeit first
  let nextYahrzeit = new HDate(hdate.getDate(), hdate.getMonth(), currentHebrewYear);
  let nextGregorian = nextYahrzeit.greg();

  // If already passed this year, get next year's
  if (nextGregorian < new Date()) {
    nextYahrzeit = new HDate(hdate.getDate(), hdate.getMonth(), currentHebrewYear + 1);
    nextGregorian = nextYahrzeit.greg();
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = nextGregorian.getTime() - now.getTime();
  const daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return {
    hebrew_date: formatHebrewDate(hdate),
    next_gregorian: nextGregorian,
    days_until: daysUntil,
    hebrew_year: nextYahrzeit.getFullYear(),
  };
}

export function getUpcomingYahrzeits(
  familyMembers: Array<{
    id: string;
    name: string;
    hebrew_name: string | null;
    member_id: string;
    date_of_death_gregorian: string;
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
    if (!fm.date_of_death_gregorian) continue;
    const yahrzeit = getNextYahrzeit(fm.date_of_death_gregorian, fm.is_after_sunset);

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
