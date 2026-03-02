import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchEmailPreferences, getUserIntent } from "@/lib/api";
import { EmailPreferences } from "@/app/(main)/settings/email-preferences/components/EmailPreferences";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BsBookmarkFill } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// This is a Server Component (no "use client")
export default async function EmailPreferencesPage() {
  const [preferences, userIntent] = await Promise.all([
    fetchEmailPreferences(),
    getUserIntent(),
  ]);

  if (!preferences.success || !preferences.data) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BsBookmarkFill />
          </EmptyMedia>
          <EmptyTitle>Failed to Fetch your preferences</EmptyTitle>
          <EmptyDescription>
            There was an issue loading your email preferences. Please try again
            later.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/settings/email-preferences">Try Again</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }
  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Email Preferences</h1>
          <p className="text-muted-foreground">
            Manage your email notification settings
          </p>
        </div>

        <Suspense fallback={<EmailPreferencesSkeleton />}>
          <EmailPreferences
            preferences={preferences.data}
            userIntent={userIntent}
          />
        </Suspense>
      </div>
    </div>
  );
}

function EmailPreferencesSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border p-6">
          <Skeleton className="mb-4 h-8 w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="mb-2 h-5 w-64" />
                  <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
