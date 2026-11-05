"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollableArea } from "@/components/ui/scroll-affordance";
import { EducationFormFields } from "./EducationFormFields";
import { useUpdateEducation } from "../hooks/manage-educations";
import { educationFormSchema } from "@/schemas/educations";
import type { Education } from "@/lib/types";

interface EditEducationDialogProps {
  education: Education | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEducationDialog({
  education,
  open,
  onOpenChange,
}: EditEducationDialogProps) {
  const updateMutation = useUpdateEducation();

  const form = useForm({
    defaultValues: {
      schoolName: education?.schoolName ?? "",
      program: education?.program ?? ("Bachelors" as const),
      major: education?.major ?? "",
      graduated: education?.graduated ?? false,
      startDate: education?.startDate ?? "",
      endDate: education?.endDate ?? undefined,
    },
    onSubmit: async ({ value }) => {
      if (!education) return;

      const result = educationFormSchema.safeParse(value);
      if (!result.success) {
        toast.error(
          result.error.issues[0]?.message || "Please check your form inputs",
        );
        return;
      }

      await updateMutation.mutateAsync({ id: education.id, data: result.data });
      onOpenChange(false);
    },
  });

  if (!education) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[90vh] max-w-2xl grid-rows-[auto_minmax(0,1fr)]">
        <DialogHeader>
          <DialogTitle>Edit Education</DialogTitle>
          <DialogDescription>
            Update your education entry details.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex min-h-0 flex-col gap-6"
        >
          <ScrollableArea className="flex-1">
            <form.Field name="schoolName">
              {(schoolNameField) => (
                <form.Field name="program">
                  {(programField) => (
                    <form.Field name="major">
                      {(majorField) => (
                        <form.Field name="startDate">
                          {(startDateField) => (
                            <form.Field name="endDate">
                              {(endDateField) => (
                                <form.Field name="graduated">
                                  {(graduatedField) => (
                                    <EducationFormFields
                                      schoolNameField={schoolNameField}
                                      programField={programField}
                                      majorField={majorField}
                                      startDateField={startDateField}
                                      endDateField={endDateField}
                                      graduatedField={graduatedField}
                                    />
                                  )}
                                </form.Field>
                              )}
                            </form.Field>
                          )}
                        </form.Field>
                      )}
                    </form.Field>
                  )}
                </form.Field>
              )}
            </form.Field>
          </ScrollableArea>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => ({
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ isSubmitting }) => (
                <Button
                  type="submit"
                  disabled={isSubmitting || updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
