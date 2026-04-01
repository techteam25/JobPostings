import { getUserInformation } from "@/lib/api";
import { FeatureErrorBoundary } from "@/components/common/FeatureErrorBoundary";
import ProfileEditForm from "./components/ProfileEditForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function ProfileEditPage() {
  const response = await getUserInformation();

  if (!response || !response.success) {
    return <ProfileEditSkeleton />;
  }

  return (
    <FeatureErrorBoundary featureName="Profile Edit">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your personal information, contact details, and social
              links.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileEditForm user={response.data} />
          </CardContent>
        </Card>
      </div>
    </FeatureErrorBoundary>
  );
}

function ProfileEditSkeleton() {
  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-5 w-64" />
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
