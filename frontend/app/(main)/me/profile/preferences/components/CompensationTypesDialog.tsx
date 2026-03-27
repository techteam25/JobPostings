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
import { COMPENSATION_TYPE_OPTIONS } from "@/schemas/job-preferences";
import { useUpdateJobPreferences } from "../hooks/use-job-preferences";

interface CompensationTypesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCompensationTypes: string[];
}

export function CompensationTypesDialog({
  open,
  onOpenChange,
  defaultCompensationTypes,
}: CompensationTypesDialogProps) {
  const mutation = useUpdateJobPreferences();

  const form = useForm({
    defaultValues: {
      compensationTypes: defaultCompensationTypes,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        compensationTypes: value.compensationTypes,
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
          <DialogTitle>Edit Compensation Types</DialogTitle>
          <DialogDescription>
            Select the types of compensation you&apos;re open to.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="compensationTypes">
              {(field) => (
                <FieldSet>
                  <FieldLegend variant="label">Compensation Types</FieldLegend>
                  <FieldGroup className="gap-3">
                    {COMPENSATION_TYPE_OPTIONS.map((option) => {
                      const checked = field.state.value.includes(option.value);
                      return (
                        <Field key={option.value} orientation="horizontal">
                          <Checkbox
                            id={`comp-type-${option.value}`}
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
                            htmlFor={`comp-type-${option.value}`}
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
