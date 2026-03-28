import { ProfileBreadcrumb } from "@/app/(main)/me/profile/components/ProfileBreadcrumb";
import {
  getJobPreferences,
  getAvailableWorkAreas,
} from "@/lib/api/job-preferences";
import { PreferenceSections } from "./components/PreferenceSections";

export default async function PreferencesPage() {
  const [preferencesResult, workAreasResult] = await Promise.all([
    getJobPreferences(),
    getAvailableWorkAreas(),
  ]);

  const preferences = preferencesResult.success ? preferencesResult.data : null;
  const availableWorkAreas = workAreasResult.success
    ? workAreasResult.data
    : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <ProfileBreadcrumb />
      <h1 className="text-foreground mb-2 text-3xl font-bold">
        Job Preferences
      </h1>
      <p className="text-muted-foreground mb-6">
        Set your job preferences to help us match you with the right
        opportunities.
      </p>
      <PreferenceSections
        preferences={preferences}
        availableWorkAreas={availableWorkAreas}
      />
    </main>
  );
}
