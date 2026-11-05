import { Suspense } from "react";
import { getUserInformation } from "@/lib/api";
import { ProfileBreadcrumb } from "@/app/(main)/me/profile/components/ProfileBreadcrumb";
import { QualificationsContent } from "./components/QualificationsContent";
import { Skeleton } from "@/components/ui/skeleton";

export default async function QualificationsPage() {
  const response = await getUserInformation();

  if (!response.success) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ProfileBreadcrumb />
        <p className="text-muted-foreground text-sm">
          Unable to load your qualifications. Please try again later.
        </p>
      </div>
    );
  }

  const { profile } = response.data;
  const education = profile?.education ?? [];
  const workExperiences = profile?.workExperiences ?? [];
  const certifications = profile?.certifications ?? [];
  const skills = profile?.skills ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <ProfileBreadcrumb />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Qualifications</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your education, work experience, certifications, and skills.
        </p>
      </div>

      <Suspense fallback={<QualificationsSkeleton />}>
        <QualificationsContent
          education={education}
          workExperiences={workExperiences}
          certifications={certifications}
          skills={skills}
        />
      </Suspense>
    </div>
  );
}

function QualificationsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
