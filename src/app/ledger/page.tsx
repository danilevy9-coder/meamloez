export const dynamic = 'force-dynamic';

import { getLedgerEntries, getMembers } from '@/lib/actions';
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

export default async function LedgerPage() {
  const [entries, members] = await Promise.all([
    getLedgerEntries(),
    getMembers(),
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
        <AddLedgerDialog members={members} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Type</TableHead>
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
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  No ledger entries yet.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {format(new Date(entry.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/members/${entry.member_id}`}
                      className="font-medium hover:underline"
                    >
                      {entry.members?.full_name ?? 'Unknown'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={entry.type === 'payment' ? 'default' : 'secondary'}
                    >
                      {entry.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {entry.currency === 'ILS' ? '\u20AA' : '$'}
                    {entry.amount_original.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {entry.exchange_rate}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {'\u20AA'}{entry.amount_ils.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
