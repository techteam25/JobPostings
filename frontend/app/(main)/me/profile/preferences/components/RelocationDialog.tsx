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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { WILLINGNESS_TO_RELOCATE_OPTIONS } from "@/schemas/job-preferences";
import { useUpdateJobPreferences } from "../hooks/use-job-preferences";

interface RelocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWillingnessToRelocate: string | null;
}

export function RelocationDialog({
  open,
  onOpenChange,
  defaultWillingnessToRelocate,
}: RelocationDialogProps) {
  const mutation = useUpdateJobPreferences();

  const form = useForm({
    defaultValues: {
      willingnessToRelocate: defaultWillingnessToRelocate ?? "",
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        willingnessToRelocate: value.willingnessToRelocate || undefined,
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
          <DialogTitle>Edit Relocation Preference</DialogTitle>
          <DialogDescription>
            Select your willingness to relocate for a role.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="willingnessToRelocate">
              {(field) => (
                <FieldSet>
                  <FieldLegend variant="label">Relocation</FieldLegend>
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    className="gap-3"
                  >
                    {WILLINGNESS_TO_RELOCATE_OPTIONS.map((option) => (
                      <Field key={option.value} orientation="horizontal">
                        <RadioGroupItem
                          value={option.value}
                          id={`relocation-${option.value}`}
                        />
                        <FieldLabel
                          htmlFor={`relocation-${option.value}`}
                          className="font-normal"
                        >
                          {option.label}
                        </FieldLabel>
                      </Field>
                    ))}
                  </RadioGroup>
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
