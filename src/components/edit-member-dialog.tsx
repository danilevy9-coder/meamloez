'use client';

import { useState } from 'react';
import { updateMember } from '@/lib/actions';
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
import { Textarea } from '@/components/ui/textarea';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { Member } from '@/types/database';

interface Props {
  member: Member;
}

export function EditMemberDialog({ member }: Props) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      await updateMember(member.id, formData);
      toast.success('Member updated');
      setOpen(false);
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="mr-2 h-3 w-3" />
        Edit
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Full Name *</Label>
              <Input id="edit_full_name" name="full_name" defaultValue={member.full_name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_hebrew_name">Hebrew Name</Label>
              <Input id="edit_hebrew_name" name="hebrew_name" defaultValue={member.hebrew_name ?? ''} dir="rtl" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit_gender">Gender *</Label>
              <Select name="gender" defaultValue={member.gender || 'male'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_membership_status">Status</Label>
              <Select name="membership_status" defaultValue={member.membership_status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="honorary">Honorary</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_address">Address</Label>
            <Input id="edit_address" name="address" defaultValue={member.address ?? ''} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Phone</Label>
              <Input id="edit_phone" name="phone" type="tel" defaultValue={member.phone ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input id="edit_email" name="email" type="email" defaultValue={member.email ?? ''} />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Spouse / Contact Info</p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="edit_spouse_name">Spouse Name (Wife)</Label>
                <Input id="edit_spouse_name" name="spouse_name" defaultValue={member.spouse_name ?? ''} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit_spouse_phone">Spouse Phone</Label>
                  <Input id="edit_spouse_phone" name="spouse_phone" type="tel" defaultValue={member.spouse_phone ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_spouse_email">Spouse Email</Label>
                  <Input id="edit_spouse_email" name="spouse_email" type="email" defaultValue={member.spouse_email ?? ''} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_membership_fee">Monthly Membership Fee (ILS)</Label>
            <Input
              id="edit_membership_fee"
              name="membership_fee"
              type="number"
              step="0.01"
              min="0"
              defaultValue={member.membership_fee ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_notes">Notes</Label>
            <Textarea
              id="edit_notes"
              name="notes"
              defaultValue={member.notes ?? ''}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full">
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
