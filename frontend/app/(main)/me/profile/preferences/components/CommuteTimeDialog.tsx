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
import { COMMUTE_TIME_OPTIONS } from "@/schemas/job-preferences";
import { useUpdateJobPreferences } from "../hooks/use-job-preferences";

interface CommuteTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCommuteTime: string | null;
}

export function CommuteTimeDialog({
  open,
  onOpenChange,
  defaultCommuteTime,
}: CommuteTimeDialogProps) {
  const mutation = useUpdateJobPreferences();

  const form = useForm({
    defaultValues: {
      commuteTime: defaultCommuteTime ?? "",
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        commuteTime: value.commuteTime || undefined,
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
          <DialogTitle>Edit Commute Time</DialogTitle>
          <DialogDescription>
            Select the maximum commute time you are willing to accept.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="commuteTime">
              {(field) => (
                <FieldSet>
                  <FieldLegend variant="label">
                    Maximum Commute Time
                  </FieldLegend>
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    className="gap-3"
                  >
                    {COMMUTE_TIME_OPTIONS.map((option) => (
                      <Field key={option.value} orientation="horizontal">
                        <RadioGroupItem
                          value={option.value}
                          id={`commute-${option.value}`}
                        />
                        <FieldLabel
                          htmlFor={`commute-${option.value}`}
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
