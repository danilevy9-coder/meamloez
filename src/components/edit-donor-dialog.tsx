'use client';

import { useState } from 'react';
import { updateDonor } from '@/lib/actions';
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
import type { Donor } from '@/types/database';

interface Props {
  donor: Donor;
}

export function EditDonorDialog({ donor }: Props) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      await updateDonor(donor.id, formData);
      toast.success('Donor updated');
      setOpen(false);
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="ghost" size="icon" className="h-8 w-8" />
      }>
        <Pencil className="h-3 w-3" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Donor</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`edit_name_${donor.id}`}>Full Name *</Label>
            <Input id={`edit_name_${donor.id}`} name="full_name" defaultValue={donor.full_name} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`edit_phone_${donor.id}`}>Phone</Label>
              <Input id={`edit_phone_${donor.id}`} name="phone" type="tel" defaultValue={donor.phone ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit_email_${donor.id}`}>Email</Label>
              <Input id={`edit_email_${donor.id}`} name="email" type="email" defaultValue={donor.email ?? ''} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lead Status</Label>
            <Select name="lead_status" defaultValue={donor.lead_status}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cold">Cold</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="regular">Regular Donor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit_notes_${donor.id}`}>Notes</Label>
            <Textarea
              id={`edit_notes_${donor.id}`}
              name="notes"
              defaultValue={donor.notes ?? ''}
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
