'use client';

import { updateSetting } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Props {
  shulRate: number;
  shulName: string;
  reminderDays: number;
}

export function SettingsForm({ shulRate, shulName, reminderDays }: Props) {
  async function handleSubmit(formData: FormData) {
    try {
      const newRate = parseFloat(formData.get('shul_rate') as string);
      const newName = formData.get('shul_name') as string;
      const newDays = parseInt(formData.get('reminder_days') as string, 10);

      await Promise.all([
        updateSetting('shul_rate', {
          rate: newRate,
          description: 'Default Shul USD/ILS rate',
        }),
        updateSetting('shul_name', newName),
        updateSetting('yahrzeit_reminder_days', newDays),
      ]);

      toast.success('Settings saved');
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message);
    }
  }

  return (
    <form action={handleSubmit}>
      <div className="grid gap-6 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shul_name">Shul Name</Label>
              <Input
                id="shul_name"
                name="shul_name"
                defaultValue={shulName}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shul_rate">
                Shul Rate (1 USD = ? ILS)
              </Label>
              <Input
                id="shul_rate"
                name="shul_rate"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={shulRate}
              />
              <p className="text-xs text-muted-foreground">
                Used as the default conversion rate when entering USD pledges/payments.
                You can override with the live market rate per transaction.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yahrzeits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reminder_days">
                Reminder Window (days ahead)
              </Label>
              <Input
                id="reminder_days"
                name="reminder_days"
                type="number"
                min="1"
                max="90"
                defaultValue={reminderDays}
              />
              <p className="text-xs text-muted-foreground">
                How many days ahead to show upcoming yahrzeits on the dashboard.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          Save Settings
        </Button>
      </div>
    </form>
  );
}
