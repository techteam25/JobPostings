import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchEmailPreferences, getUserIntent } from "@/lib/api";
import { EmailPreferences } from "@/app/(main)/settings/email-preferences/components/EmailPreferences";
import { JobAlertsList } from "@/app/(main)/settings/job-alerts/components/JobAlertsList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function NotificationsPage() {
  const [preferencesResponse, userIntent] = await Promise.all([
    fetchEmailPreferences(),
    getUserIntent(),
  ]);

  const hasPreferencesError = !preferencesResponse.success;

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your notification preferences and job alerts
          </p>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email Preferences</TabsTrigger>
            <TabsTrigger value="alerts">Job Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-6">
            {hasPreferencesError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load email preferences. Please try again later.
                </AlertDescription>
              </Alert>
            ) : (
              <EmailPreferences
                preferences={preferencesResponse.data}
                userIntent={userIntent}
              />
            )}
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <JobAlertsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
