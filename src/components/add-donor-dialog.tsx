'use client';

import { useState } from 'react';
import { createDonor } from '@/lib/actions';
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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function AddDonorDialog() {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      await createDonor(formData);
      toast.success('Donor added');
      setOpen(false);
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        Add Donor
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Donor</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input id="full_name" name="full_name" required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead_status">Lead Status</Label>
            <Select name="lead_status" defaultValue="cold">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cold">Cold - No recent engagement</SelectItem>
                <SelectItem value="warm">Warm - Occasional engagement</SelectItem>
                <SelectItem value="hot">Hot - High likelihood of donation</SelectItem>
                <SelectItem value="regular">Regular Donor - Consistent contributor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any notes about this donor..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full">
            Add Donor
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
