'use client';

import { useState } from 'react';
import { createFamilyMember } from '@/lib/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { HEBREW_MONTHS } from '@/lib/yahrzeit';

interface Props {
  memberId: string;
}

export function AddFamilyMemberDialog({ memberId }: Props) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      await createFamilyMember(formData);
      toast.success('Family member added');
      setOpen(false);
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UserPlus className="mr-2 h-4 w-4" />
        Add Family Member
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="member_id" value={memberId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hebrew_name">Hebrew Name</Label>
              <Input id="hebrew_name" name="hebrew_name" dir="rtl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship *</Label>
            <Select name="relationship" required>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
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
                <Label htmlFor="yahrzeit_day">Day</Label>
                <Select name="yahrzeit_day">
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
                <Label htmlFor="yahrzeit_month">Month</Label>
                <Select name="yahrzeit_month">
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
            Add Family Member
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
