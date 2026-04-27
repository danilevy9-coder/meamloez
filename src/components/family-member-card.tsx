'use client';

import { useState } from 'react';
import type { FamilyMember } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trash2, Pencil } from 'lucide-react';
import { deleteFamilyMember, updateFamilyMember } from '@/lib/actions';
import { toast } from 'sonner';
import { HEBREW_MONTHS } from '@/lib/yahrzeit';

interface Props {
  familyMember: FamilyMember;
  hebrewDeathDate?: string;
  nextYahrzeitDisplay?: string;
}

export function FamilyMemberCard({
  familyMember,
  hebrewDeathDate,
  nextYahrzeitDisplay,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    if (!confirm(`Remove ${familyMember.name}?`)) return;
    try {
      await deleteFamilyMember(familyMember.id, familyMember.member_id);
      toast.success('Family member removed');
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message);
    }
  }

  async function handleEdit(formData: FormData) {
    try {
      await updateFamilyMember(familyMember.id, formData);
      toast.success('Family member updated');
      setEditOpen(false);
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message);
    }
  }

  return (
    <Card>
      <CardContent className="flex items-start justify-between pt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{familyMember.name}</p>
            <Badge variant="outline" className="text-xs">
              {familyMember.relationship}
            </Badge>
          </div>
          {familyMember.hebrew_name && (
            <p className="text-sm text-muted-foreground" dir="rtl">
              {familyMember.hebrew_name}
            </p>
          )}
          {hebrewDeathDate && (
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                Yahrzeit: {hebrewDeathDate}
              </p>
              {nextYahrzeitDisplay && (
                <p className="text-xs font-medium text-orange-600">
                  {nextYahrzeitDisplay}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              />
            }>
              <Pencil className="h-4 w-4" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Family Member</DialogTitle>
              </DialogHeader>
              <form action={handleEdit} className="space-y-4">
                <input type="hidden" name="member_id" value={familyMember.member_id} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`edit_name_${familyMember.id}`}>Name *</Label>
                    <Input
                      id={`edit_name_${familyMember.id}`}
                      name="name"
                      defaultValue={familyMember.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`edit_hname_${familyMember.id}`}>Hebrew Name</Label>
                    <Input
                      id={`edit_hname_${familyMember.id}`}
                      name="hebrew_name"
                      defaultValue={familyMember.hebrew_name ?? ''}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Relationship *</Label>
                  <Select name="relationship" defaultValue={familyMember.relationship} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wife">Wife</SelectItem>
                      <SelectItem value="husband">Husband</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Yahrzeit (Hebrew Date of Death)</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Day</Label>
                      <Select name="yahrzeit_day" defaultValue={familyMember.yahrzeit_day ? String(familyMember.yahrzeit_day) : undefined}>
                        <SelectTrigger>
                          <SelectValue placeholder="Day..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                            <SelectItem key={d} value={String(d)}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Month</Label>
                      <Select name="yahrzeit_month" defaultValue={familyMember.yahrzeit_month ? String(familyMember.yahrzeit_month) : undefined}>
                        <SelectTrigger>
                          <SelectValue placeholder="Month..." />
                        </SelectTrigger>
                        <SelectContent>
                          {HEBREW_MONTHS.map((m) => (
                            <SelectItem key={m.value} value={String(m.value)}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Save Changes
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
