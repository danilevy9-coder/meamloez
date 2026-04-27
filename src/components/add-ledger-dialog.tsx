'use client';

import { useState } from 'react';
import { createLedgerEntry } from '@/lib/actions';
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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Member, LedgerType, Donor } from '@/types/database';

interface Props {
  members: Member[];
  donors: Donor[];
  defaultMemberId?: string;
  defaultType?: LedgerType;
  trigger?: React.ReactElement;
}

export function AddLedgerDialog({
  members,
  donors,
  defaultMemberId,
  defaultType = 'pledge',
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [assignTo, setAssignTo] = useState<'member' | 'donor'>(
    defaultMemberId ? 'member' : 'member'
  );

  async function handleSubmit(formData: FormData) {
    try {
      // Clear the field that isn't being used
      if (assignTo === 'member') {
        formData.delete('donor_id');
      } else {
        formData.delete('member_id');
      }
      await createLedgerEntry(formData);
      toast.success(
        formData.get('type') === 'pledge'
          ? 'Pledge recorded'
          : 'Payment recorded'
      );
      setOpen(false);
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {defaultType === 'payment' ? 'Record Payment' : 'Add Pledge'}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {/* Assign to Member or Donor */}
          {!defaultMemberId && donors.length > 0 && (
            <div className="space-y-2">
              <Label>Assign To</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={assignTo === 'member' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAssignTo('member')}
                >
                  Member
                </Button>
                <Button
                  type="button"
                  variant={assignTo === 'donor' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAssignTo('donor')}
                >
                  Donor
                </Button>
              </div>
            </div>
          )}

          {assignTo === 'member' ? (
            <div className="space-y-2">
              <Label htmlFor="member_id">Member *</Label>
              <select
                name="member_id"
                defaultValue={defaultMemberId ?? ''}
                required={assignTo === 'member'}
                className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="" disabled>Select member...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="donor_id">Donor *</Label>
              <select
                name="donor_id"
                required={assignTo === 'donor'}
                className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="" disabled>Select donor...</option>
                {donors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={defaultType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pledge">Pledge</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="income_category">Category</Label>
              <Select name="income_category" defaultValue="donation">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="donation">Donation</SelectItem>
                  <SelectItem value="membership_fee">Membership Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              name="description"
              placeholder="e.g., Aliyah Kiddush, Annual Membership"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount_original">Amount *</Label>
              <Input
                id="amount_original"
                name="amount_original"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" defaultValue="USD">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="ILS">ILS (&#8362;)</SelectItem>
                  <SelectItem value="GBP">GBP (&#163;)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use_shul_rate"
              name="use_shul_rate"
              value="true"
              defaultChecked
              className="rounded"
            />
            <Label htmlFor="use_shul_rate" className="text-sm">
              Use Shul Rate (otherwise live market rate)
            </Label>
          </div>

          <Button type="submit" className="w-full">
            Save Entry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
