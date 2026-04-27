export const dynamic = 'force-dynamic';

import { getDashboardStats, getAllFamilyMembersWithDeathDates } from '@/lib/actions';
import { getUpcomingYahrzeits, getTodayHebrewDate } from '@/lib/yahrzeit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, TrendingUp, Users, CandlestickChart, Heart, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { currencySymbol } from '@/lib/currency';

export default async function DashboardPage() {
  const [stats, familyWithDeath] = await Promise.all([
    getDashboardStats(),
    getAllFamilyMembersWithDeathDates(),
  ]);

  const upcomingYahrzeits = getUpcomingYahrzeits(
    familyWithDeath.map((fm) => ({
      id: fm.id,
      name: fm.name,
      hebrew_name: fm.hebrew_name,
      member_id: fm.member_id,
      yahrzeit_day: fm.yahrzeit_day,
      yahrzeit_month: fm.yahrzeit_month,
      date_of_death_gregorian: fm.date_of_death_gregorian,
      is_after_sunset: fm.is_after_sunset,
    })),
    7
  );

  const todayHebrew = getTodayHebrewDate();
  const todayEnglish = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gabbai Dashboard</h1>
        <p className="text-muted-foreground">
          Command center for Meam Loez
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <span className="text-muted-foreground">{todayEnglish}</span>
          <span className="font-medium" dir="ltr">{todayHebrew}</span>
        </div>
      </div>

      {/* Stats Cards Row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Pledges
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalOutstandingIls.toLocaleString('he-IL', {
                style: 'currency',
                currency: 'ILS',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              ~${stats.totalOutstandingUsd.toLocaleString()} USD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Income: Donations
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalDonationsIls.toLocaleString('he-IL', {
                style: 'currency',
                currency: 'ILS',
              })}
            </div>
            <p className="text-xs text-muted-foreground">Total donation payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Income: Membership Fees
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalMembershipFeesIls.toLocaleString('he-IL', {
                style: 'currency',
                currency: 'ILS',
              })}
            </div>
            <p className="text-xs text-muted-foreground">Total fee payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Exchange Rates</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              1 USD = {stats.liveRate} ILS
            </div>
            <p className="text-xs text-muted-foreground">
              Shul rate: {stats.shulRate}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards Row 2 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.memberCount}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.donorCount}</div>
            <p className="text-xs text-muted-foreground">Non-member donors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Yahrzeits
            </CardTitle>
            <CandlestickChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingYahrzeits.length}</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent payments</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentPayments.map((p) => {
                    const displayName = p.members?.full_name ?? p.donors?.full_name ?? 'Unknown';
                    const linkHref = p.member_id
                      ? `/members/${p.member_id}`
                      : p.donor_id
                        ? `/donors`
                        : '#';
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <Link href={linkHref} className="hover:underline">
                            {displayName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.income_category === 'membership_fee' ? 'secondary' : 'outline'} className="text-xs">
                            {p.income_category === 'membership_fee' ? 'Fee' : 'Donation'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {currencySymbol(p.currency)}
                          {p.amount_original.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(p.created_at), 'MMM d')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Yahrzeits */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Yahrzeits (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingYahrzeits.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No yahrzeits in the next 7 days
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingYahrzeits.map((y) => (
                  <div
                    key={y.family_member_id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{y.name}</p>
                      {y.hebrew_name && (
                        <p className="text-sm text-muted-foreground">
                          {y.hebrew_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {y.yahrzeit.hebrew_date}
                      </p>
                    </div>
                    <Badge
                      variant={y.yahrzeit.days_until <= 1 ? 'destructive' : 'secondary'}
                    >
                      {y.yahrzeit.days_until === 0
                        ? 'Today'
                        : y.yahrzeit.days_until === 1
                          ? 'Tomorrow'
                          : `${y.yahrzeit.days_until} days`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
