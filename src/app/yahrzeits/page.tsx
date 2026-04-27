export const dynamic = 'force-dynamic';

import { getAllFamilyMembersWithDeathDates } from '@/lib/actions';
import { getNextYahrzeit, formatHebrewDate, gregorianToHebrewDayMonth } from '@/lib/yahrzeit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';

export default async function YahrzeitsPage() {
  const familyMembers = await getAllFamilyMembersWithDeathDates();

  const yahrzeits = familyMembers
    .map((fm) => {
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

      if (!day || !month) return null;

      const hebrewDate = formatHebrewDate(day, month);
      const yahrzeit = getNextYahrzeit(day, month);

      return {
        ...fm,
        hebrew_date: hebrewDate,
        yahrzeit,
      };
    })
    .filter((y): y is NonNullable<typeof y> => y !== null)
    .sort((a, b) => a.yahrzeit.days_until - b.yahrzeit.days_until);

  const upcoming = yahrzeits.filter((y) => y.yahrzeit.days_until <= 30);
  const later = yahrzeits.filter((y) => y.yahrzeit.days_until > 30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Yahrzeit Tracker</h1>
        <p className="text-muted-foreground">
          Hebrew anniversary dates for all niftarim
        </p>
      </div>

      {/* Upcoming (next 30 days) */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Upcoming (Next 30 Days) — {upcoming.length}
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No yahrzeits in the next 30 days
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((y) => (
              <Card key={y.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{y.name}</CardTitle>
                    <Badge
                      variant={
                        y.yahrzeit.days_until <= 1
                          ? 'destructive'
                          : y.yahrzeit.days_until <= 7
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {y.yahrzeit.days_until === 0
                        ? 'Today'
                        : y.yahrzeit.days_until === 1
                          ? 'Tomorrow'
                          : `${y.yahrzeit.days_until} days`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {y.hebrew_name && (
                    <p className="text-sm text-muted-foreground" dir="rtl">
                      {y.hebrew_name}
                    </p>
                  )}
                  <p className="text-sm">{y.hebrew_date}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(y.yahrzeit.next_gregorian, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Member:{' '}
                    <Link
                      href={`/members/${y.member_id}`}
                      className="hover:underline font-medium"
                    >
                      {(y as unknown as { members: { full_name: string } }).members.full_name}
                    </Link>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* All others */}
      {later.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            All Yahrzeits — {later.length}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {later.map((y) => (
              <Card key={y.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{y.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {y.hebrew_name && (
                    <p className="text-sm text-muted-foreground" dir="rtl">
                      {y.hebrew_name}
                    </p>
                  )}
                  <p className="text-sm">{y.hebrew_date}</p>
                  <p className="text-xs text-muted-foreground">
                    Next: {format(y.yahrzeit.next_gregorian, 'MMM d, yyyy')} ({y.yahrzeit.days_until} days)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Member:{' '}
                    <Link
                      href={`/members/${y.member_id}`}
                      className="hover:underline font-medium"
                    >
                      {(y as unknown as { members: { full_name: string } }).members.full_name}
                    </Link>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
