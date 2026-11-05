import { getUserInformation } from "@/lib/api";
import { ReadyToWorkForm } from "./ReadyToWorkForm";
import { ProfileBreadcrumb } from "@/app/(main)/me/profile/components/ProfileBreadcrumb";

export default async function ReadyToWorkPage() {
  const profile = await getUserInformation();

  const isAvailableForWork =
    profile?.success && profile.data.profile
      ? profile.data.profile.isAvailableForWork
      : true;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <ProfileBreadcrumb />

      <h1 className="text-foreground mb-2 text-3xl font-bold">Ready to work</h1>
      <p className="text-muted-foreground mb-6">
        Let employers know that you can begin work right away.
      </p>

      <ReadyToWorkForm defaultAvailable={isAvailableForWork} />
    </main>
  );
}
