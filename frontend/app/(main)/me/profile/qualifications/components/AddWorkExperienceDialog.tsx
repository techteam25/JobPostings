"use client";

import { useForm } from "@tanstack/react-form";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
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
import { Separator } from "@/components/ui/separator";
import { WorkExperienceFormFields } from "./WorkExperienceFormFields";
import { useBatchCreateWorkExperiences } from "../hooks/manage-work-experiences";
import {
  workExperienceFormSchema,
  type WorkExperienceFormData,
} from "@/schemas/work-experiences";

const emptyEntry: WorkExperienceFormData = {
  companyName: "",
  jobTitle: "",
  description: "",
  current: false,
  startDate: "",
  endDate: undefined,
};

interface AddWorkExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddWorkExperienceDialog({
  open,
  onOpenChange,
}: AddWorkExperienceDialogProps) {
  const batchCreateMutation = useBatchCreateWorkExperiences();

  const form = useForm({
    defaultValues: {
      workExperiences: [{ ...emptyEntry }] as WorkExperienceFormData[],
    },
    onSubmit: async ({ value }) => {
      const result = z
        .array(workExperienceFormSchema)
        .safeParse(value.workExperiences);
      if (!result.success) {
        toast.error(
          result.error.issues[0]?.message || "Please check your form inputs",
        );
        return;
      }

      await batchCreateMutation.mutateAsync(result.data);
      onOpenChange(false);
      form.reset();
    },
  });

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Work Experience</DialogTitle>
          <DialogDescription>
            Add your work history. You can add multiple entries at once.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name="workExperiences" mode="array">
            {(arrayField) => (
              <div className="flex flex-col gap-6">
                {arrayField.state.value.map((_, index) => (
                  <div key={index}>
                    {index > 0 && <Separator className="mb-6" />}
                    <div className="flex flex-col gap-4">
                      {arrayField.state.value.length > 1 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Entry {index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => arrayField.removeValue(index)}
                          >
                            <Trash2 data-icon="inline-start" />
                            Remove
                          </Button>
                        </div>
                      )}

                      <form.Field
                        name={`workExperiences[${index}].companyName`}
                      >
                        {(companyNameField) => (
                          <form.Field
                            name={`workExperiences[${index}].jobTitle`}
                          >
                            {(jobTitleField) => (
                              <form.Field
                                name={`workExperiences[${index}].description`}
                              >
                                {(descriptionField) => (
                                  <form.Field
                                    name={`workExperiences[${index}].startDate`}
                                  >
                                    {(startDateField) => (
                                      <form.Field
                                        name={`workExperiences[${index}].endDate`}
                                      >
                                        {(endDateField) => (
                                          <form.Field
                                            name={`workExperiences[${index}].current`}
                                          >
                                            {(currentField) => (
                                              <WorkExperienceFormFields
                                                companyNameField={
                                                  companyNameField
                                                }
                                                jobTitleField={jobTitleField}
                                                descriptionField={
                                                  descriptionField
                                                }
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
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => arrayField.pushValue({ ...emptyEntry })}
                >
                  <Plus data-icon="inline-start" />
                  Add Another
                </Button>
              </div>
            )}
          </form.Field>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
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
                  disabled={isSubmitting || batchCreateMutation.isPending}
                >
                  {batchCreateMutation.isPending
                    ? "Saving..."
                    : "Save Work Experience"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
