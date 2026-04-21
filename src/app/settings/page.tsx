export const dynamic = 'force-dynamic';

import { getSetting } from '@/lib/actions';
import { SettingsForm } from '@/components/settings-form';

export default async function SettingsPage() {
  const [shulRateSetting, shulNameSetting, reminderDaysSetting] =
    await Promise.all([
      getSetting('shul_rate'),
      getSetting('shul_name'),
      getSetting('yahrzeit_reminder_days'),
    ]);

  const shulRate =
    (shulRateSetting as { rate: number; description: string } | null)?.rate ?? 3.7;
  const shulName = (shulNameSetting as string) ?? 'Meam Loez';
  const reminderDays = (reminderDaysSetting as number) ?? 7;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure ShulFlow for your community
        </p>
      </div>

      <SettingsForm
        shulRate={shulRate}
        shulName={shulName}
        reminderDays={reminderDays}
      />
    </div>
  );
}
