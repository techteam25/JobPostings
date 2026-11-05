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
import { WorkExperienceFormFields } from "./WorkExperienceFormFields";
import { useUpdateWorkExperience } from "../hooks/manage-work-experiences";
import { workExperienceFormSchema } from "@/schemas/work-experiences";
import type { WorkExperience } from "@/lib/types";

interface EditWorkExperienceDialogProps {
  experience: WorkExperience | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWorkExperienceDialog({
  experience,
  open,
  onOpenChange,
}: EditWorkExperienceDialogProps) {
  const updateMutation = useUpdateWorkExperience();

  const form = useForm({
    defaultValues: {
      companyName: experience?.companyName ?? "",
      jobTitle: experience?.jobTitle ?? "",
      description: experience?.description ?? "",
      current: experience?.current ?? false,
      startDate: experience?.startDate ?? "",
      endDate: experience?.endDate ?? undefined,
    },
    onSubmit: async ({ value }) => {
      if (!experience) return;

      const result = workExperienceFormSchema.safeParse(value);
      if (!result.success) {
        toast.error(
          result.error.issues[0]?.message || "Please check your form inputs",
        );
        return;
      }

      await updateMutation.mutateAsync({
        id: experience.id,
        data: result.data,
      });
      onOpenChange(false);
    },
  });

  if (!experience) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[90vh] max-w-2xl grid-rows-[auto_minmax(0,1fr)]">
        <DialogHeader>
          <DialogTitle>Edit Work Experience</DialogTitle>
          <DialogDescription>
            Update your work experience entry details.
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
            <form.Field name="companyName">
              {(companyNameField) => (
                <form.Field name="jobTitle">
                  {(jobTitleField) => (
                    <form.Field name="description">
                      {(descriptionField) => (
                        <form.Field name="startDate">
                          {(startDateField) => (
                            <form.Field name="endDate">
                              {(endDateField) => (
                                <form.Field name="current">
                                  {(currentField) => (
                                    <WorkExperienceFormFields
                                      companyNameField={companyNameField}
                                      jobTitleField={jobTitleField}
                                      descriptionField={descriptionField}
                                      startDateField={startDateField}
                                      endDateField={endDateField}
                                      currentField={currentField}
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
