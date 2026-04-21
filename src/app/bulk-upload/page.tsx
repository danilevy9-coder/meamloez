import { BulkUploadMembers } from '@/components/bulk-upload-members';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function BulkUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bulk Upload Members
        </h1>
        <p className="text-muted-foreground">
          Import members from a CSV file. Upload any CSV and map the columns to
          ShulFlow fields.
        </p>
      </div>

      {/* CSV Format Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Expected CSV Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your CSV can have any column headers — you'll map them after uploading. Here are the ShulFlow fields you can import into:
          </p>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ShulFlow Field</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Example</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Full Name</TableCell>
                  <TableCell>
                    <Badge variant="destructive">Required</Badge>
                  </TableCell>
                  <TableCell>Member's full name (English)</TableCell>
                  <TableCell className="text-muted-foreground">
                    Moshe Cohen
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Hebrew Name</TableCell>
                  <TableCell>
                    <Badge variant="outline">Optional</Badge>
                  </TableCell>
                  <TableCell>Hebrew name (RTL supported)</TableCell>
                  <TableCell className="text-muted-foreground" dir="rtl">
                    משה בן אברהם
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Phone</TableCell>
                  <TableCell>
                    <Badge variant="outline">Optional</Badge>
                  </TableCell>
                  <TableCell>Phone number</TableCell>
                  <TableCell className="text-muted-foreground">
                    054-123-4567
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Email</TableCell>
                  <TableCell>
                    <Badge variant="outline">Optional</Badge>
                  </TableCell>
                  <TableCell>Email address</TableCell>
                  <TableCell className="text-muted-foreground">
                    moshe@example.com
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Address</TableCell>
                  <TableCell>
                    <Badge variant="outline">Optional</Badge>
                  </TableCell>
                  <TableCell>Home address</TableCell>
                  <TableCell className="text-muted-foreground">
                    12 Herzl St, Jerusalem
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Notes</TableCell>
                  <TableCell>
                    <Badge variant="outline">Optional</Badge>
                  </TableCell>
                  <TableCell>Any notes about the member</TableCell>
                  <TableCell className="text-muted-foreground">
                    Founding member, prefers morning minyan
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Membership Status
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Optional</Badge>
                  </TableCell>
                  <TableCell>
                    One of: active, inactive, honorary, suspended.
                    Defaults to "active"
                  </TableCell>
                  <TableCell className="text-muted-foreground">active</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: columns like "Name", "Member Name", or "Full Name" will
            auto-map. You can always adjust the mapping manually.
          </p>
        </CardContent>
      </Card>

      <BulkUploadMembers />
    </div>
  );
}
