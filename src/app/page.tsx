export const dynamic = 'force-dynamic';

import { getDashboardStats, getAllFamilyMembersWithDeathDates } from '@/lib/actions';
import { getUpcomingYahrzeits } from '@/lib/yahrzeit';
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
import { DollarSign, TrendingUp, Users, CandlestickChart } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

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
      date_of_death_gregorian: fm.date_of_death_gregorian!,
      is_after_sunset: fm.is_after_sunset,
    })),
    7
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gabbai Dashboard</h1>
        <p className="text-muted-foreground">
          Command center for Meam Loez
        </p>
      </div>

      {/* Stats Cards */}
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
            <CardTitle className="text-sm font-medium">Shul Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              1 USD = {stats.rate} ILS
            </div>
            <p className="text-xs text-muted-foreground">Configured shul rate</p>
          </CardContent>
        </Card>

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
                    <TableHead>Member</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/members/${p.member_id}`}
                          className="hover:underline"
                        >
                          {p.members?.full_name ?? 'Unknown'}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {p.currency === 'ILS' ? '\u20AA' : '$'}
                        {p.amount_original.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(p.created_at), 'MMM d')}
                      </TableCell>
                    </TableRow>
                  ))}
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
