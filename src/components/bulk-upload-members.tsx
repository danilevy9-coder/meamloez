'use client';

import { useState, useCallback } from 'react';
import { bulkCreateMembers } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileUp, Check, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import type { MembershipStatus } from '@/types/database';

const SHULFLOW_FIELDS = [
  { key: 'full_name', label: 'Full Name', required: true },
  { key: 'hebrew_name', label: 'Hebrew Name', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'notes', label: 'Notes', required: false },
  { key: 'membership_status', label: 'Membership Status', required: false },
] as const;

const SKIP = '__skip__';

type FieldKey = (typeof SHULFLOW_FIELDS)[number]['key'];

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split('\n');
  if (lines.length < 1) return { headers: [], rows: [] };

  // Handle quoted CSV fields
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).filter((l) => l.trim()).map(parseLine);

  return { headers, rows };
}

function autoMatchColumn(header: string): FieldKey | typeof SKIP {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');

  const patterns: Array<{ keys: string[]; field: FieldKey }> = [
    { keys: ['fullname', 'name', 'membername', 'firstname'], field: 'full_name' },
    { keys: ['hebrewname', 'hebrew', 'shem'], field: 'hebrew_name' },
    { keys: ['phone', 'tel', 'mobile', 'cell'], field: 'phone' },
    { keys: ['email', 'mail'], field: 'email' },
    { keys: ['address', 'addr', 'street', 'city'], field: 'address' },
    { keys: ['notes', 'note', 'comments', 'comment', 'memo'], field: 'notes' },
    { keys: ['status', 'membershipstatus', 'memberstatus'], field: 'membership_status' },
  ];

  for (const p of patterns) {
    if (p.keys.some((k) => h.includes(k))) return p.field;
  }
  return SKIP;
}

export function BulkUploadMembers() {
  const [fileName, setFileName] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<number, FieldKey | typeof SKIP>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { headers, rows } = parseCSV(text);

      if (headers.length === 0) {
        toast.error('Could not parse CSV headers');
        return;
      }

      setCsvHeaders(headers);
      setCsvRows(rows);

      // Auto-match columns
      const autoMap: Record<number, FieldKey | typeof SKIP> = {};
      headers.forEach((h, i) => {
        autoMap[i] = autoMatchColumn(h);
      });
      setColumnMap(autoMap);

      toast.success(`Parsed ${rows.length} rows with ${headers.length} columns`);
    };
    reader.readAsText(file);
  }, []);

  function updateMapping(colIndex: number, field: FieldKey | typeof SKIP) {
    setColumnMap((prev) => ({ ...prev, [colIndex]: field }));
  }

  const fullNameMapped = Object.values(columnMap).includes('full_name');

  async function handleUpload() {
    if (!fullNameMapped) {
      toast.error('You must map at least the "Full Name" column');
      return;
    }

    setIsUploading(true);
    try {
      const validStatuses = ['active', 'inactive', 'honorary', 'suspended'];
      const members = csvRows.map((row) => {
        const member: Record<string, string> = {};
        Object.entries(columnMap).forEach(([colIdx, field]) => {
          if (field !== SKIP) {
            member[field] = row[parseInt(colIdx)] ?? '';
          }
        });
        // Validate membership_status
        if (member.membership_status && !validStatuses.includes(member.membership_status.toLowerCase())) {
          delete member.membership_status;
        } else if (member.membership_status) {
          member.membership_status = member.membership_status.toLowerCase();
        }
        return member as {
          full_name: string;
          hebrew_name?: string;
          phone?: string;
          email?: string;
          address?: string;
          notes?: string;
          membership_status?: MembershipStatus;
        };
      });

      const res = await bulkCreateMembers(members);
      setResult(res);

      if (res.inserted > 0) {
        toast.success(`${res.inserted} members imported successfully`);
      }
      if (res.errors.length > 0) {
        toast.error(`${res.errors.length} errors occurred`);
      }
    } catch (e) {
      toast.error('Upload failed: ' + (e as Error).message);
    } finally {
      setIsUploading(false);
    }
  }

  function reset() {
    setFileName('');
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMap({});
    setResult(null);
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-muted/50 transition-colors">
            <FileUp className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm font-medium">
              {fileName || 'Click to upload CSV file'}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Any CSV with member data — you'll map the columns next
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

      {/* Column Mapping */}
      {csvHeaders.length > 0 && !result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Map Columns</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={reset}>
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={isUploading || !fullNameMapped}
                >
                  {isUploading ? 'Importing...' : `Import ${csvRows.length} Members`}
                </Button>
              </div>
            </div>
            {!fullNameMapped && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Map at least the "Full Name" column to continue
              </p>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Match each column from your CSV to a ShulFlow field. We auto-detected
              what we could — review and adjust as needed.
            </p>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">CSV Column</TableHead>
                    <TableHead className="min-w-[200px]">Maps To</TableHead>
                    <TableHead>Preview (first 3 rows)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvHeaders.map((header, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{header}</TableCell>
                      <TableCell>
                        <Select
                          value={columnMap[i] ?? SKIP}
                          onValueChange={(v) => updateMapping(i, v as FieldKey | typeof SKIP)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SKIP}>
                              <span className="text-muted-foreground">— Skip —</span>
                            </SelectItem>
                            {SHULFLOW_FIELDS.map((f) => (
                              <SelectItem key={f.key} value={f.key}>
                                {f.label}
                                {f.required && ' *'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {csvRows
                          .slice(0, 3)
                          .map((row) => row[i] ?? '')
                          .filter(Boolean)
                          .join(' · ') || '(empty)'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mapped fields summary */}
            <div className="mt-4 flex flex-wrap gap-2">
              {SHULFLOW_FIELDS.map((f) => {
                const mapped = Object.values(columnMap).includes(f.key);
                return (
                  <Badge
                    key={f.key}
                    variant={mapped ? 'default' : f.required ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {mapped ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    {f.label}
                    {f.required && ' *'}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="font-medium">{result.inserted} members imported</span>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  {result.errors.length} errors:
                </p>
                <ul className="text-sm text-muted-foreground space-y-0.5">
                  {result.errors.map((err, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 text-destructive shrink-0" />
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button variant="outline" onClick={reset}>
              Upload Another File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
