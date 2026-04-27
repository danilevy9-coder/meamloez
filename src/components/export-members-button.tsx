'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { Member } from '@/types/database';

interface Props {
  members: Member[];
}

export function ExportMembersButton({ members }: Props) {
  function handleExport() {
    const headers = [
      'Full Name',
      'Hebrew Name',
      'Gender',
      'Phone',
      'Email',
      'Address',
      'Status',
      'Spouse Name',
      'Spouse Phone',
      'Spouse Email',
      'Monthly Fee (ILS)',
      'Notes',
    ];

    const rows = members.map((m) => [
      m.full_name,
      m.hebrew_name ?? '',
      m.gender ?? '',
      m.phone ?? '',
      m.email ?? '',
      m.address ?? '',
      m.membership_status,
      m.spouse_name ?? '',
      m.spouse_phone ?? '',
      m.spouse_email ?? '',
      m.membership_fee?.toString() ?? '',
      (m.notes ?? '').replace(/"/g, '""'),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}
