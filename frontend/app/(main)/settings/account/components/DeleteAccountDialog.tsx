"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  Mail,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { env } from "@/env";
import { authClient } from "@/lib/auth";
import { instance } from "@/lib/axios-instance";

type WalkAwayOrg = {
  id: number;
  name: string;
  hasActiveAdmin: boolean;
};

type WalkAwayClassification = {
  blocking: WalkAwayOrg[];
  willBeDeleted: WalkAwayOrg[];
};

type DialogState =
  | { kind: "form" }
  | { kind: "submitting" }
  | { kind: "sent" }
  | {
      kind: "blocked";
      blocking: WalkAwayOrg[];
      willBeDeleted: WalkAwayOrg[];
    };

interface DeleteAccountDialogProps {
  email: string;
  intent: "seeker" | "employer";
}

const SEEKER_BULLETS = [
  "Your profile, resume, and qualifications",
  "Your job applications",
  "Your saved jobs, job alerts, and recommendations",
  "Your email preferences",
];

const EMPLOYER_BULLETS = [
  "Your account profile",
  "Your membership in organizations you belong to",
  "Your email preferences",
];

export default function DeleteAccountDialog({
  email,
  intent,
}: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [typedEmail, setTypedEmail] = useState("");
  const [state, setState] = useState<DialogState>({ kind: "form" });
  const [preview, setPreview] = useState<WalkAwayClassification>({
    blocking: [],
    willBeDeleted: [],
  });

  const canSubmit = typedEmail === email && state.kind === "form";
  const bullets = intent === "employer" ? EMPLOYER_BULLETS : SEEKER_BULLETS;

  useEffect(() => {
    if (!open || intent !== "employer") return;

    let cancelled = false;
    void instance
      .get("/users/me/walk-away-organizations", { withCredentials: true })
      .then((response) => {
        if (cancelled) return;
        const data = response.data?.data;
        setPreview({
          blocking: Array.isArray(data?.blocking) ? data.blocking : [],
          willBeDeleted: Array.isArray(data?.willBeDeleted)
            ? data.willBeDeleted
            : [],
        });
      })
      .catch(() => {
        if (!cancelled) {
          setPreview({ blocking: [], willBeDeleted: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, intent]);

  function resetAndClose(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setTypedEmail("");
      setState({ kind: "form" });
      setPreview({ blocking: [], willBeDeleted: [] });
    }
  }

  async function handleSubmit() {
    setState({ kind: "submitting" });
    const callbackURL = `${env.NEXT_PUBLIC_FRONTEND_URL}/account-deleted`;

    const { error } = await authClient.deleteUser({ callbackURL });

    if (!error) {
      setState({ kind: "sent" });
      return;
    }

    const blocked = extractWalkAwayDetails(error);
    if (blocked && blocked.blocking.length > 0) {
      setState({
        kind: "blocked",
        blocking: blocked.blocking,
        willBeDeleted: blocked.willBeDeleted,
      });
      return;
    }

    setState({ kind: "form" });
    toast.error(error.message ?? "Failed to request account deletion.");
  }

  return (
    <section
      aria-label="Danger zone"
      className="border-destructive/50 rounded-lg border p-6"
    >
      <h2 className="text-destructive text-lg font-semibold">Danger Zone</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Permanently delete your getINvolved account and all associated data.
      </p>

      <div className="mt-4">
        <AlertDialog open={open} onOpenChange={resetAndClose}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 data-icon="inline-start" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            {state.kind === "sent" ? (
              <SentView email={email} onClose={() => resetAndClose(false)} />
            ) : state.kind === "blocked" ? (
              <BlockedView
                blocking={state.blocking}
                willBeDeleted={state.willBeDeleted}
                onClose={() => resetAndClose(false)}
              />
            ) : (
              <FormView
                email={email}
                bullets={bullets}
                typedEmail={typedEmail}
                onTypedEmailChange={setTypedEmail}
                onSubmit={handleSubmit}
                isSubmitting={state.kind === "submitting"}
                canSubmit={canSubmit}
                intent={intent}
                willBeDeleted={
                  preview.blocking.length === 0 ? preview.willBeDeleted : []
                }
                hasBlockingOrgs={preview.blocking.length > 0}
              />
            )}
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}

interface FormViewProps {
  email: string;
  bullets: string[];
  typedEmail: string;
  onTypedEmailChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  intent: "seeker" | "employer";
  willBeDeleted: WalkAwayOrg[];
  hasBlockingOrgs: boolean;
}

function FormView({
  email,
  bullets,
  typedEmail,
  onTypedEmailChange,
  onSubmit,
  isSubmitting,
  canSubmit,
  intent,
  willBeDeleted,
  hasBlockingOrgs,
}: FormViewProps) {
  const showSoloDeleteConfirm =
    intent === "employer" && !hasBlockingOrgs && willBeDeleted.length > 0;
  const showGenericOwnerNotice =
    intent === "employer" && !showSoloDeleteConfirm;

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Account</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="space-y-3">
            <p>This action cannot be undone. This will permanently delete:</p>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              {bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {showGenericOwnerNotice && (
              <p className="text-muted-foreground text-sm italic">
                To delete an organization you own, transfer ownership or delete
                the organization first.
              </p>
            )}
            {showSoloDeleteConfirm && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  Deleting your account will permanently delete these
                  organizations:
                </p>
                <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                  {willBeDeleted.map((org) => (
                    <li key={org.id}>{org.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="flex flex-col gap-2 py-4">
        <Label htmlFor="confirm-email">
          Type <strong>{email}</strong> to confirm
        </Label>
        <Input
          id="confirm-email"
          type="email"
          value={typedEmail}
          onChange={(e) => onTypedEmailChange(e.target.value)}
          placeholder={email}
          autoComplete="off"
        />
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" data-icon="inline-start" />
              Sending...
            </>
          ) : (
            "Delete Account"
          )}
        </Button>
      </AlertDialogFooter>
    </>
  );
}

function SentView({ email, onClose }: { email: string; onClose: () => void }) {
  return (
    <>
      <AlertDialogHeader>
        <div className="bg-accent mb-2 flex size-12 items-center justify-center rounded-full">
          <Mail className="text-primary size-6" />
        </div>
        <AlertDialogTitle>Check your email</AlertDialogTitle>
        <AlertDialogDescription>
          We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click
          the link to permanently delete your account. The link expires in one
          hour.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </AlertDialogFooter>
    </>
  );
}

function BlockedView({
  blocking,
  willBeDeleted,
  onClose,
}: {
  blocking: WalkAwayOrg[];
  willBeDeleted: WalkAwayOrg[];
  onClose: () => void;
}) {
  return (
    <>
      <AlertDialogHeader>
        <div className="bg-destructive/10 mb-2 flex size-12 items-center justify-center rounded-full">
          <AlertTriangle className="text-destructive size-6" />
        </div>
        <AlertDialogTitle>
          Transfer or delete your organizations first
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="space-y-3">
            <p>
              You own the following organization
              {blocking.length > 1 ? "s" : ""} with other active members.
              Transfer ownership or delete the organization before deleting your
              account:
            </p>
            <ul className="flex flex-col gap-2">
              {blocking.map((org) => (
                <li key={org.id}>
                  <Link
                    href={orgDeepLink(org)}
                    className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                  >
                    {org.name}
                    <ExternalLink className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
            {willBeDeleted.length > 0 && (
              <div className="space-y-2">
                <p>
                  These organizations will be deleted once nothing blocks your
                  account deletion:
                </p>
                <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                  {willBeDeleted.map((org) => (
                    <li key={org.id}>{org.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </AlertDialogFooter>
    </>
  );
}

function orgDeepLink(org: WalkAwayOrg): string {
  if (org.hasActiveAdmin) {
    return `/employer/organizations/${org.id}/settings?tab=members`;
  }
  return `/employer/organizations/${org.id}/settings/edit`;
}

function parseOrg(entry: unknown): WalkAwayOrg | null {
  if (!entry || typeof entry !== "object") return null;
  const id = (entry as { id?: unknown }).id;
  const name = (entry as { name?: unknown }).name;
  if (typeof id !== "number" || typeof name !== "string") return null;
  return {
    id,
    name,
    hasActiveAdmin: Boolean(
      (entry as { hasActiveAdmin?: unknown }).hasActiveAdmin,
    ),
  };
}

function extractWalkAwayDetails(error: unknown): WalkAwayClassification | null {
  if (!error || typeof error !== "object") return null;
  const maybeDetails = (error as { details?: unknown }).details;
  if (!maybeDetails || typeof maybeDetails !== "object") return null;

  const details = maybeDetails as {
    blocking?: unknown;
    willBeDeleted?: unknown;
    orgs?: unknown;
  };

  const blockingSource = Array.isArray(details.blocking)
    ? details.blocking
    : Array.isArray(details.orgs)
      ? details.orgs
      : [];
  const willBeDeletedSource = Array.isArray(details.willBeDeleted)
    ? details.willBeDeleted
    : [];

  const blocking = blockingSource
    .map(parseOrg)
    .filter((org): org is WalkAwayOrg => org !== null);
  const willBeDeleted = willBeDeletedSource
    .map(parseOrg)
    .filter((org): org is WalkAwayOrg => org !== null);

  if (blocking.length === 0 && willBeDeleted.length === 0) return null;
  return { blocking, willBeDeleted };
}
