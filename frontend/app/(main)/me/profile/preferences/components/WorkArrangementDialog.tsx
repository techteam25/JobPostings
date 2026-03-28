"use client";

import { useForm } from "@tanstack/react-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { WORK_ARRANGEMENT_OPTIONS } from "@/schemas/job-preferences";
import { useUpdateJobPreferences } from "../hooks/use-job-preferences";

interface WorkArrangementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWorkArrangements: string[];
}

export function WorkArrangementDialog({
  open,
  onOpenChange,
  defaultWorkArrangements,
}: WorkArrangementDialogProps) {
  const mutation = useUpdateJobPreferences();

  const form = useForm({
    defaultValues: {
      workArrangements: defaultWorkArrangements,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        workArrangements: value.workArrangements,
      });
      onOpenChange(false);
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
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Work Arrangement</DialogTitle>
          <DialogDescription>
            Select your preferred work arrangements.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="workArrangements">
              {(field) => (
                <FieldSet>
                  <FieldLegend variant="label">Work Arrangement</FieldLegend>
                  <FieldGroup className="gap-3">
                    {WORK_ARRANGEMENT_OPTIONS.map((option) => {
                      const checked = field.state.value.includes(option.value);
                      return (
                        <Field key={option.value} orientation="horizontal">
                          <Checkbox
                            id={`arrangement-${option.value}`}
                            checked={checked}
                            onCheckedChange={(isChecked) => {
                              const current = field.state.value;
                              field.handleChange(
                                isChecked
                                  ? [...current, option.value]
                                  : current.filter(
                                      (v: string) => v !== option.value,
                                    ),
                              );
                            }}
                          />
                          <FieldLabel
                            htmlFor={`arrangement-${option.value}`}
                            className="font-normal"
                          >
                            {option.label}
                          </FieldLabel>
                        </Field>
                      );
                    })}
                  </FieldGroup>
                </FieldSet>
              )}
            </form.Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
