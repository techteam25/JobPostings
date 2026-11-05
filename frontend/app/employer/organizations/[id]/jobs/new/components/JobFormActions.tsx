"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobFormApi } from "../hooks/use-create-job-form";

interface JobFormActionsProps {
  form: JobFormApi;
  isPending: boolean;
  organizationId: number;
  mode?: "create" | "edit";
}

export function JobFormActions({
  form,
  isPending,
  organizationId,
  mode = "create",
}: JobFormActionsProps) {
  const router = useRouter();

  return (
    <form.Subscribe
      selector={(state) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
      })}
    >
      {({ canSubmit, isSubmitting }) => (
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(`/employer/organizations/${organizationId}/jobs`)
            }
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting || isPending}
            className="bg-primary/90 hover:bg-primary"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 animate-spin" />
                {mode === "edit" ? "Saving..." : "Creating..."}
              </>
            ) : mode === "edit" ? (
              "Save Changes"
            ) : (
              "Post Job"
            )}
          </Button>
        </div>
      )}
    </form.Subscribe>
  );
}
