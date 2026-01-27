"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useUnsubscribe, useUnsubscribeInfo } from "../actions/use-unsubscribe";

export default function UnsubscribeComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const {
    data,
    isLoading: loading,
    error: loadError,
  } = useUnsubscribeInfo(token);

  const {
    mutate: unsubscribe,
    isPending: unsubscribing,
    isSuccess: success,
    error: unsubscribeError,
  } = useUnsubscribe();

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertDescription>Invalid unsubscribe link</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertDescription>
            {(loadError as any).response?.data?.message ||
              "Failed to load data"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-2xl p-8">
          <h1 className="mb-4 text-3xl font-bold">Unsubscribed Successfully</h1>
          <p className="text-muted-foreground mb-6">
            You have been unsubscribed from all email communications.
          </p>
          <Button onClick={() => router.push("/settings/email-preferences")}>
            Manage All Preferences
          </Button>
        </Card>
      </div>
    );
  }

  const handleUnsubscribe = () => {
    if (token) {
      unsubscribe(token);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8">
        <h1 className="mb-2 text-3xl font-bold">Unsubscribe from Emails</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          {data?.user?.email}
        </p>

        {(unsubscribeError as any) && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {(unsubscribeError as any).response?.data?.message ||
                "Failed to unsubscribe"}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6 space-y-4">
          <p>
            You're about to unsubscribe from all non-essential email
            communications. You will still receive:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Account security alerts</li>
            <li>Critical account notifications</li>
            <li>Transactional emails (required by law)</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleUnsubscribe}
            disabled={unsubscribing}
            variant="destructive"
          >
            {unsubscribing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unsubscribing...
              </>
            ) : (
              "Unsubscribe from All"
            )}
          </Button>
          <Button
            onClick={() => router.push("/settings/email-preferences")}
            variant="outline"
          >
            Manage All Preferences
          </Button>
        </div>

        <p className="text-muted-foreground mt-6 text-sm">
          Want to customize which emails you receive?{" "}
          <a
            href="/settings/email-preferences"
            className="text-primary underline"
          >
            Manage your preferences
          </a>{" "}
          instead (requires login).
        </p>
      </Card>
    </div>
  );
}
