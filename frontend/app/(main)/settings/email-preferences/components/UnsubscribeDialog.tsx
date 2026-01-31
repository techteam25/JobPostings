"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnsubscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: "job_seeker" | "employer" | "global" | null;
  onConfirm: () => void;
  isLoading: boolean;
}

export default function UnsubscribeDialog({
  open,
  onOpenChange,
  context,
  onConfirm,
  isLoading,
}: UnsubscribeDialogProps) {
  const getDialogContent = () => {
    switch (context) {
      case "global":
        return {
          title: "Unsubscribe from All Emails?",
          description:
            "You will stop receiving all non-essential emails. You may miss important opportunities and updates.",
        };
      case "job_seeker":
        return {
          title: "Unsubscribe from Job Seeker Emails?",
          description:
            "You will stop receiving job-related notifications. You may miss job opportunities.",
        };
      case "employer":
        return {
          title: "Unsubscribe from Employer Emails?",
          description:
            "You will stop receiving candidate match notifications.",
        };
      default:
        return { title: "", description: "" };
    }
  };

  const { title, description } = getDialogContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Unsubscribing..." : "Unsubscribe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
