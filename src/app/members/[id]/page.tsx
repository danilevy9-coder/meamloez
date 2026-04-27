export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getMember,
  getFamilyMembers,
  getMemberBalance,
  getLedgerEntries,
  getMembers,
  getDonors,
} from '@/lib/actions';
import { getNextYahrzeit, formatHebrewDate, gregorianToHebrewDayMonth } from '@/lib/yahrzeit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AddFamilyMemberDialog } from '@/components/add-family-member-dialog';
import { FamilyMemberCard } from '@/components/family-member-card';
import { AddLedgerDialog } from '@/components/add-ledger-dialog';
import { EditMemberDialog } from '@/components/edit-member-dialog';
import { currencySymbol } from '@/lib/currency';

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [member, familyMembers, balance, ledgerEntries, allMembers, allDonors] =
    await Promise.all([
      getMember(id),
      getFamilyMembers(id),
      getMemberBalance(id),
      getLedgerEntries(id),
      getMembers(),
      getDonors(),
    ]);

  if (!member) notFound();

  const balanceIls = balance?.balance_ils ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/members">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{member.full_name}</h1>
            <Badge
              variant={
                member.membership_status === 'active' ? 'default' : 'secondary'
              }
            >
              {member.membership_status}
            </Badge>
            <Badge variant="outline">{member.gender}</Badge>
            <EditMemberDialog member={member} />
          </div>
          {member.hebrew_name && (
            <p className="text-muted-foreground" dir="rtl">
              {member.hebrew_name}
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {member.phone && <span>{member.phone}</span>}
            {member.email && <span>{member.email}</span>}
            {member.address && <span>{member.address}</span>}
          </div>
          {/* Spouse info */}
          {member.spouse_name && (
            <div className="mt-2 text-sm text-muted-foreground border-l-2 pl-3">
              <p className="font-medium text-foreground">Spouse: {member.spouse_name}</p>
              <div className="flex flex-wrap gap-4">
                {member.spouse_phone && <span>{member.spouse_phone}</span>}
                {member.spouse_email && <span>{member.spouse_email}</span>}
              </div>
            </div>
          )}
          {member.notes && (
            <p className="mt-2 text-sm text-muted-foreground italic border-l-2 pl-3">
              {member.notes}
            </p>
          )}
        </div>
      </div>

      {/* Balance & Fee Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pledges</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(balance?.total_pledges_ils ?? 0).toLocaleString('he-IL', {
                style: 'currency',
                currency: 'ILS',
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {(balance?.total_payments_ils ?? 0).toLocaleString('he-IL', {
                style: 'currency',
                currency: 'ILS',
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${balanceIls > 0 ? 'text-red-600' : 'text-green-600'}`}
            >
              {balanceIls.toLocaleString('he-IL', {
                style: 'currency',
                currency: 'ILS',
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {member.membership_fee
                ? `\u20AA${member.membership_fee.toLocaleString()}/mo`
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Family Members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Family Members</h2>
          <AddFamilyMemberDialog memberId={id} />
        </div>
        {familyMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No family members added yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {familyMembers.map((fm) => {
              let day = fm.yahrzeit_day;
              let month = fm.yahrzeit_month;

              // Fallback: derive from Gregorian date
              if ((!day || !month) && fm.date_of_death_gregorian) {
                const derived = gregorianToHebrewDayMonth(
                  fm.date_of_death_gregorian,
                  fm.is_after_sunset
                );
                day = derived.day;
                month = derived.month;
              }

              let hebrewDeathDate: string | undefined;
              let nextYahrzeitDisplay: string | undefined;

              if (day && month) {
                hebrewDeathDate = formatHebrewDate(day, month);
                const yahrzeit = getNextYahrzeit(day, month);
                nextYahrzeitDisplay =
                  yahrzeit.days_until === 0
                    ? 'Yahrzeit TODAY'
                    : yahrzeit.days_until === 1
                      ? 'Yahrzeit TOMORROW'
                      : yahrzeit.days_until <= 30
                        ? `Yahrzeit in ${yahrzeit.days_until} days`
                        : `Next: ${format(yahrzeit.next_gregorian, 'MMM d, yyyy')}`;
              }

              return (
                <FamilyMemberCard
                  key={fm.id}
                  familyMember={fm}
                  hebrewDeathDate={hebrewDeathDate}
                  nextYahrzeitDisplay={nextYahrzeitDisplay}
                />
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Ledger */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Ledger</h2>
          <div className="flex gap-2">
            <AddLedgerDialog
              members={allMembers}
              donors={allDonors}
              defaultMemberId={id}
              defaultType="pledge"
              trigger={
                <Button variant="outline" size="sm">
                  + Pledge
                </Button>
              }
            />
            <AddLedgerDialog
              members={allMembers}
              donors={allDonors}
              defaultMemberId={id}
              defaultType="payment"
              trigger={
                <Button size="sm">
                  + Payment
                </Button>
              }
            />
          </div>
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right hidden sm:table-cell">
                  Amount (ILS)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerEntries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No ledger entries yet.
                  </TableCell>
                </TableRow>
              ) : (
                ledgerEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(entry.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.type === 'payment' ? 'default' : 'secondary'
                        }
                      >
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.income_category === 'membership_fee' ? 'Membership Fee' : 'Donation'}
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      {currencySymbol(entry.currency)}
                      {entry.amount_original.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell text-muted-foreground">
                      {'\u20AA'}
                      {entry.amount_ils.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
