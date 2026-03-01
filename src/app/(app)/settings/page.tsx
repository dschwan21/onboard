import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth/server";

export default async function SettingsPage() {
  const { profile, user } = await getCurrentUserProfile();

  return (
    <PageShell
      title="Settings"
      description="Account profile values stored in the `profiles` table."
    >
      <Card className="p-6">
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="mt-1 font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Role</dt>
            <dd className="mt-1 font-medium capitalize">{profile?.role ?? "user"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Profession</dt>
            <dd className="mt-1 font-medium">{profile?.profession ?? "Unset"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Organization</dt>
            <dd className="mt-1 font-medium">{profile?.organization ?? "Unset"}</dd>
          </div>
        </dl>
      </Card>
    </PageShell>
  );
}
