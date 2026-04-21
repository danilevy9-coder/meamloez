export const dynamic = 'force-dynamic';

import { getMembers, getPendingPledges, getSetting } from '@/lib/actions';
import { NedarimImporter } from '@/components/nedarim-importer';

export default async function ImportPage() {
  const [members, pendingPledges, shulRateSetting] = await Promise.all([
    getMembers(),
    getPendingPledges(),
    getSetting('shul_rate'),
  ]);

  const shulRate =
    (shulRateSetting as { rate: number } | null)?.rate ?? 3.7;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Nedarim Plus Importer
        </h1>
        <p className="text-muted-foreground">
          Upload a Nedarim Plus CSV to reconcile payments against members and
          pending pledges. Nothing hits the database until you approve.
        </p>
      </div>

      <NedarimImporter
        members={members}
        pendingPledges={pendingPledges}
        shulRate={shulRate}
      />
    </div>
  );
}
