"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Job } from "@/schemas/responses/jobs";

interface ReopenJobDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (applicationDeadline: string) => Promise<void>;
  isPending?: boolean;
}

function tomorrowInputValue() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ReopenJobDialog({
  job,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: ReopenJobDialogProps) {
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const minDeadline = tomorrowInputValue();
  const canSubmit = applicationDeadline >= minDeadline;

  if (!job) return null;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setApplicationDeadline("");
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    await onConfirm(applicationDeadline);
    setApplicationDeadline("");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reopen job listing</DialogTitle>
          <DialogDescription>
            Choose a new application deadline for &ldquo;{job.title}&rdquo;.
            Reopening without a future deadline would leave the listing closed to
            applicants.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reopen-application-deadline">
              Application Deadline
            </Label>
            <Input
              id="reopen-application-deadline"
              type="date"
              min={minDeadline}
              value={applicationDeadline}
              onChange={(event) => setApplicationDeadline(event.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || isPending}
              className="bg-primary/90 hover:bg-primary"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 animate-spin" />
                  Reopening...
                </>
              ) : (
                "Reopen"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
