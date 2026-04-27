export const dynamic = 'force-dynamic';

import { getLedgerEntries, getMembers, getDonors } from '@/lib/actions';
import { AddLedgerDialog } from '@/components/add-ledger-dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import Link from 'next/link';
import { currencySymbol } from '@/lib/currency';

export default async function LedgerPage() {
  const [entries, members, donors] = await Promise.all([
    getLedgerEntries(),
    getMembers(),
    getDonors(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Unified Ledger</h1>
          <p className="text-muted-foreground">
            All pledges and payments across the shul
          </p>
        </div>
        <AddLedgerDialog members={members} donors={donors} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Original</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">ILS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                >
                  No ledger entries yet.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const displayName = entry.members?.full_name ?? entry.donors?.full_name ?? 'Unknown';
                const linkHref = entry.member_id
                  ? `/members/${entry.member_id}`
                  : '/donors';
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(new Date(entry.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={linkHref}
                        className="font-medium hover:underline"
                      >
                        {displayName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.type === 'payment' ? 'default' : 'secondary'}
                      >
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.income_category === 'membership_fee' ? 'Fee' : 'Donation'}
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      {currencySymbol(entry.currency)}
                      {entry.amount_original.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {entry.exchange_rate}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {'\u20AA'}{entry.amount_ils.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
