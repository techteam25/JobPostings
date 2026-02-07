import { JobAlertsList } from "@/app/(main)/settings/job-alerts/components/JobAlertsList";
import { fetchJobAlerts } from "@/lib/api";

export default async function NotificationsPage() {
  const initialJobAlerts = await fetchJobAlerts(1, 10);

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your notification preferences and job alerts
          </p>
        </div>

        <JobAlertsList initialData={initialJobAlerts} />
      </div>
    </div>
  );
}
