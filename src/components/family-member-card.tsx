'use client';

import type { FamilyMember } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteFamilyMember } from '@/lib/actions';
import { toast } from 'sonner';

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
  async function handleDelete() {
    if (!confirm(`Remove ${familyMember.name}?`)) return;
    try {
      await deleteFamilyMember(familyMember.id, familyMember.member_id);
      toast.success('Family member removed');
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
