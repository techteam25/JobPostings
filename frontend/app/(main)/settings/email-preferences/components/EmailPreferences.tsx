"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  useEmailPreferences,
  useResubscribePreferences,
  useUnsubscribePreferences,
  useUpdatePreference,
} from "@/app/(main)/settings/email-preferences/hooks/manage-preferences";
import { type EmailPreferences as EmailPreferencesType } from "@/lib/types";
import { UserIntentResponse } from "@/schemas/responses/users";
import PreferenceSection from "@/app/(main)/settings/email-preferences/components/PreferenceSection";
import UnsubscribeDialog from "@/app/(main)/settings/email-preferences/components/UnsubscribeDialog";
import { useUserSession } from "@/app/(main)/hooks/use-user-session";
import { authClient } from "@/lib/auth";

export function EmailPreferences({
  preferences: initialPreferences,
  userIntent,
}: {
  preferences: EmailPreferencesType;
  userIntent: UserIntentResponse;
}) {
  const [showUnsubscribeDialog, setShowUnsubscribeDialog] = useState(false);
  const [unsubscribeContext, setUnsubscribeContext] = useState<
    "job_seeker" | "employer" | "global" | null
  >(null);
  const [isResending, setIsResending] = useState(false);
  const { data: sessionData, isPending: isSessionPending } = useUserSession();

  const handleResendVerification = async () => {
    const email = sessionData?.data?.user?.email;
    if (!email) return;

    setIsResending(true);
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/email-verified",
      });
      toast.success("Verification email sent!");
    } catch {
      toast.error("Failed to send verification email.");
    } finally {
      setIsResending(false);
    }
  };

  // Use TanStack Query with server-provided initial data
  const { data: preferences } = useEmailPreferences(initialPreferences);

  const updatePreference = useUpdatePreference();
  const unsubscribePreference = useUnsubscribePreferences();
  const resubscribePreference = useResubscribePreferences();

  const handleTogglePreference = (
    preferenceType: string,
    currentValue: boolean,
    context: "job_seeker" | "employer" | "global",
  ) => {
    updatePreference.mutate({
      preferenceType,
      enabled: !currentValue,
      context,
    });
  };

  const handleUnsubscribeClick = (
    context: "job_seeker" | "employer" | "global",
  ) => {
    setUnsubscribeContext(context);
    setShowUnsubscribeDialog(true);
  };

  const handleConfirmUnsubscribe = () => {
    if (unsubscribeContext) {
      unsubscribePreference.mutate(unsubscribeContext, {
        onSuccess: () => setShowUnsubscribeDialog(false),
      });
    }
  };

  return (
    <>
      {/* Email Verification Status */}
      {!isSessionPending && sessionData?.data?.user && (
        <div className="mb-6 rounded-lg border p-4">
          <h3 className="mb-2 text-sm font-semibold">Email Verification</h3>
          {sessionData.data.user.emailVerified ? (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Email verified</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                <span>Email not verified</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                disabled={isResending}
                className="cursor-pointer"
              >
                {isResending ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : null}
                Resend verification email
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Global Unsubscribe Alert */}
      {preferences.globalUnsubscribe && (
        <Alert className="mb-6">
          <AlertDescription>
            You are currently unsubscribed from all emails.{" "}
            <Button
              variant="link"
              className="p-0"
              onClick={() => resubscribePreference.mutate("global")}
            >
              Re-subscribe
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Job Seeker Preferences */}
      <PreferenceSection
        title="Job Seeker Preferences"
        description="Notifications related to your job search"
        isUnsubscribed={preferences.jobSeekerUnsubscribed}
        onUnsubscribe={() => handleUnsubscribeClick("job_seeker")}
        onResubscribe={() => resubscribePreference.mutate("job_seeker")}
        preferences={[
          {
            key: "jobMatchNotifications",
            label: "Job Match Notifications",
            description: "Get notified when new jobs match your preferences",
            enabled: preferences.jobMatchNotifications,
            context: "job_seeker",
          },
          {
            key: "applicationStatusNotifications",
            label: "Application Status Notifications",
            description: "Updates on your job applications",
            enabled: preferences.applicationStatusNotifications,
            context: "job_seeker",
          },
          {
            key: "savedJobUpdates",
            label: "Saved Job Updates",
            description: "Notifications about jobs you've saved",
            enabled: preferences.savedJobUpdates,
            context: "job_seeker",
          },
          {
            key: "weeklyJobDigest",
            label: "Weekly Job Digest",
            description: "Curated job opportunities every week",
            enabled: preferences.weeklyJobDigest,
            context: "job_seeker",
          },
        ]}
        onTogglePreference={handleTogglePreference}
        disabled={preferences.jobSeekerUnsubscribed}
      />

      {/* Employer Preferences */}
      {userIntent.success && userIntent.data.intent === "employer" && (
        <PreferenceSection
          title="Employer Preferences"
          description="Notifications for hiring and recruitment"
          isUnsubscribed={preferences.employerUnsubscribed}
          onUnsubscribe={() => handleUnsubscribeClick("employer")}
          onResubscribe={() => resubscribePreference.mutate("employer")}
          preferences={[
            {
              key: "matchedCandidates",
              label: "Matched Candidates",
              description:
                "Get notified when candidates match your job postings",
              enabled: preferences.matchedCandidates,
              context: "employer",
            },
          ]}
          onTogglePreference={handleTogglePreference}
          disabled={preferences.employerUnsubscribed}
        />
      )}

      {/* General Preferences */}
      <PreferenceSection
        title="General Preferences"
        description="Newsletter and marketing emails"
        isUnsubscribed={false}
        onUnsubscribe={() => handleUnsubscribeClick("global")}
        preferences={[
          {
            key: "monthlyNewsletter",
            label: "Monthly Newsletter",
            description: "Career tips and platform updates",
            enabled: preferences.monthlyNewsletter,
            context: "global",
          },
          {
            key: "marketingEmails",
            label: "Marketing Emails",
            description: "Special offers and promotional content",
            enabled: preferences.marketingEmails,
            context: "global",
          },
          {
            key: "accountSecurityAlerts",
            label: "Account Security Alerts",
            description: "Critical security notifications (cannot be disabled)",
            enabled: true,
            context: "global",
            locked: true,
          },
        ]}
        onTogglePreference={handleTogglePreference}
        disabled={preferences.globalUnsubscribe}
        showGlobalUnsubscribe
      />

      {/* Unsubscribe Confirmation Dialog */}
      <UnsubscribeDialog
        open={showUnsubscribeDialog}
        onOpenChange={setShowUnsubscribeDialog}
        context={unsubscribeContext}
        onConfirm={handleConfirmUnsubscribe}
        isLoading={unsubscribePreference.isPending}
      />
    </>
  );
}
