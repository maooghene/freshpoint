// app/admin/settings/page.tsx
import { getSystemSettings } from "@/lib/actions/admin-settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const initialSettings = await getSystemSettings();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 border-b border-border pb-6 min-w-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Global Configurations
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Configure financial rules, platform-wide baselines, and commission
          rates.
        </p>
      </div>

      <SettingsForm initialSettings={initialSettings} />
    </div>
  );
}
