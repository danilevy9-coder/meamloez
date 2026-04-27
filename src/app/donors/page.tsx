export const dynamic = 'force-dynamic';

import { getDonors } from '@/lib/actions';
import { AddDonorDialog } from '@/components/add-donor-dialog';
import { EditDonorDialog } from '@/components/edit-donor-dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  cold: 'secondary',
  warm: 'outline',
  hot: 'destructive',
  regular: 'default',
};

const statusLabels: Record<string, string> = {
  cold: 'Cold',
  warm: 'Warm',
  hot: 'Hot',
  regular: 'Regular Donor',
};

export default async function DonorsPage() {
  const donors = await getDonors();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Donors</h1>
          <p className="text-muted-foreground">
            {donors.length} donors (non-members)
          </p>
        </div>
        <AddDonorDialog />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No donors yet. Add your first donor above.
                </TableCell>
              </TableRow>
            ) : (
              donors.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.full_name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {d.phone ?? '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {d.email ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[d.lead_status] ?? 'secondary'}>
                      {statusLabels[d.lead_status] ?? d.lead_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <EditDonorDialog donor={d} />
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
