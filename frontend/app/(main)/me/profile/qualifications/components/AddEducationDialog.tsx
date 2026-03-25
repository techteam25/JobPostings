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
import { EducationFormFields } from "./EducationFormFields";
import { useBatchCreateEducations } from "../hooks/manage-educations";
import {
  educationFormSchema,
  type EducationFormData,
} from "@/schemas/educations";

const emptyEntry: EducationFormData = {
  schoolName: "",
  program: "Bachelors",
  major: "",
  graduated: false,
  startDate: "",
  endDate: undefined,
};

interface AddEducationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEducationDialog({
  open,
  onOpenChange,
}: AddEducationDialogProps) {
  const batchCreateMutation = useBatchCreateEducations();

  const form = useForm({
    defaultValues: {
      educations: [{ ...emptyEntry }] as EducationFormData[],
    },
    onSubmit: async ({ value }) => {
      const result = z.array(educationFormSchema).safeParse(value.educations);
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
          <DialogTitle>Add Education</DialogTitle>
          <DialogDescription>
            Add your education history. You can add multiple entries at once.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name="educations" mode="array">
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

                      <form.Field name={`educations[${index}].schoolName`}>
                        {(schoolNameField) => (
                          <form.Field name={`educations[${index}].program`}>
                            {(programField) => (
                              <form.Field name={`educations[${index}].major`}>
                                {(majorField) => (
                                  <form.Field
                                    name={`educations[${index}].startDate`}
                                  >
                                    {(startDateField) => (
                                      <form.Field
                                        name={`educations[${index}].endDate`}
                                      >
                                        {(endDateField) => (
                                          <form.Field
                                            name={`educations[${index}].graduated`}
                                          >
                                            {(graduatedField) => (
                                              <EducationFormFields
                                                schoolNameField={
                                                  schoolNameField
                                                }
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
                    : "Save Education"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
