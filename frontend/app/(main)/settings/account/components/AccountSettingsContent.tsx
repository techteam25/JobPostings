"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FeatureErrorBoundary } from "@/components/common/FeatureErrorBoundary";

import DeleteAccountDialog from "./DeleteAccountDialog";

interface AccountSettingsContentProps {
  fullName: string;
  email: string;
  intent: "seeker" | "employer";
}

export default function AccountSettingsContent({
  fullName,
  email,
  intent,
}: AccountSettingsContentProps) {
  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-foreground mb-2 text-3xl font-bold">
            Account Settings
          </h1>
          <p className="text-secondary-foreground">
            Manage your account and permanent deletion.
          </p>
        </header>

        <FeatureErrorBoundary featureName="account-settings">
          <section
            aria-label="Account summary"
            className="border-border rounded-lg border p-6"
          >
            <h2 className="text-foreground mb-4 text-lg font-semibold">
              Account
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-sm">Name</dt>
                <dd className="text-foreground font-medium">{fullName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Email</dt>
                <dd className="text-foreground font-medium">{email}</dd>
              </div>
            </dl>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/me/profile">Edit profile</Link>
            </Button>
          </section>

          <DeleteAccountDialog email={email} intent={intent} />
        </FeatureErrorBoundary>
      </div>
    </div>
  );
}
