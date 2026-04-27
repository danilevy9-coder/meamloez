export const dynamic = 'force-dynamic';

import { getMembers } from '@/lib/actions';
import { AddMemberDialog } from '@/components/add-member-dialog';
import { ExportMembersButton } from '@/components/export-members-button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">
            {members.length} members registered
          </p>
        </div>
        <div className="flex gap-2">
          <ExportMembersButton members={members} />
          <AddMemberDialog />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Hebrew Name</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Spouse</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No members yet. Add your first member above.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Link
                      href={`/members/${m.id}`}
                      className="font-medium hover:underline"
                    >
                      {m.full_name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground" dir="rtl">
                    {m.hebrew_name ?? '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {m.phone ?? '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {m.email ?? '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {m.spouse_name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={m.membership_status === 'active' ? 'default' : 'secondary'}
                    >
                      {m.membership_status}
                    </Badge>
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
