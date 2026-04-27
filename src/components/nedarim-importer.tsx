'use client';

import { useState, useCallback } from 'react';
import { parseNedarimCSV, matchNedarimRows } from '@/lib/fuzzy-match';
import { batchCreatePayments } from '@/lib/actions';
import { convertToILS } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, Check, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { Member, LedgerEntry, ReconciliationMatch } from '@/types/database';

interface Props {
  members: Member[];
  pendingPledges: LedgerEntry[];
  shulRate: number;
}

export function NedarimImporter({ members, pendingPledges, shulRate }: Props) {
  const [matches, setMatches] = useState<ReconciliationMatch[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isCommitting, setIsCommitting] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        const rows = parseNedarimCSV(text);

        if (rows.length === 0) {
          toast.error('No valid rows found in CSV');
          return;
        }

        const results = matchNedarimRows(rows, members, pendingPledges);
        setMatches(results);

        // Auto-select high confidence matches
        const autoSelect = new Set<number>();
        results.forEach((m, i) => {
          if (m.status === 'high') autoSelect.add(i);
        });
        setSelected(autoSelect);

        toast.success(`Parsed ${rows.length} rows, found ${autoSelect.size} high-confidence matches`);
      };
      reader.readAsText(file);
    },
    [members, pendingPledges]
  );

  function toggleSelect(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  async function handleCommit() {
    const toCommit = matches.filter((_, i) => selected.has(i) && matches[i].matched_member);

    if (toCommit.length === 0) {
      toast.error('No matches selected');
      return;
    }

    setIsCommitting(true);
    try {
      const entries = toCommit.map((match) => {
        const amountIls = convertToILS(
          match.nedarim_row.amount,
          match.nedarim_row.currency,
          match.nedarim_row.currency === 'USD' ? shulRate : 1
        );
        return {
          member_id: match.matched_member!.id,
          description: match.nedarim_row.description || `Nedarim Plus Payment`,
          amount_original: match.nedarim_row.amount,
          currency: match.nedarim_row.currency,
          exchange_rate: match.nedarim_row.currency === 'USD' ? shulRate : 1,
          amount_ils: amountIls,
          external_ref: match.nedarim_row.reference || null,
        };
      });

      await batchCreatePayments(entries);
      toast.success(`${entries.length} payments committed to ledger`);
      setMatches([]);
      setSelected(new Set());
      setFileName('');
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message);
    } finally {
      setIsCommitting(false);
    }
  }

  const statusIcon = (status: ReconciliationMatch['status']) => {
    switch (status) {
      case 'high':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const statusColor = (status: ReconciliationMatch['status']) => {
    switch (status) {
      case 'high':
        return 'default' as const;
      case 'medium':
        return 'secondary' as const;
      case 'low':
        return 'outline' as const;
      default:
        return 'destructive' as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Nedarim Plus CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm font-medium">
              {fileName || 'Click to upload CSV file'}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Supports Nedarim Plus payment exports
            </span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </CardContent>
      </Card>

      {/* Reconciliation Results */}
      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Proposed Matches ({matches.length} rows)
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMatches([]);
                    setSelected(new Set());
                    setFileName('');
                  }}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={handleCommit}
                  disabled={isCommitting || selected.size === 0}
                >
                  {isCommitting
                    ? 'Committing...'
                    : `Approve & Commit (${selected.size})`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>CSV Payer</TableHead>
                    <TableHead>Matched Member</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Pending Pledge?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match, i) => (
                    <TableRow
                      key={i}
                      className={
                        match.status === 'high'
                          ? 'bg-green-50 dark:bg-green-950/20'
                          : undefined
                      }
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selected.has(i)}
                          onChange={() => toggleSelect(i)}
                          disabled={!match.matched_member}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {match.nedarim_row.payer_name}
                      </TableCell>
                      <TableCell>
                        {match.matched_member ? (
                          <span>{match.matched_member.full_name}</span>
                        ) : (
                          <span className="text-muted-foreground italic">
                            No match
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {statusIcon(match.status)}
                          <Badge variant={statusColor(match.status)}>
                            {match.confidence}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {match.nedarim_row.currency === 'ILS' ? '\u20AA' : '$'}
                        {match.nedarim_row.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {match.pending_pledge ? (
                          <Badge variant="outline" className="text-green-700">
                            {'\u20AA'}
                            {match.pending_pledge.amount_ils.toLocaleString()} pledge
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
