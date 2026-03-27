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
import {
  WORK_SCHEDULE_DAY_OPTIONS,
  SCHEDULE_TYPE_OPTIONS,
} from "@/schemas/job-preferences";
import { useUpdateJobPreferences } from "../hooks/use-job-preferences";

interface WorkScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWorkScheduleDays: string[];
  defaultScheduleTypes: string[];
}

export function WorkScheduleDialog({
  open,
  onOpenChange,
  defaultWorkScheduleDays,
  defaultScheduleTypes,
}: WorkScheduleDialogProps) {
  const mutation = useUpdateJobPreferences();

  const form = useForm({
    defaultValues: {
      workScheduleDays: defaultWorkScheduleDays,
      scheduleTypes: defaultScheduleTypes,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        workScheduleDays: value.workScheduleDays,
        scheduleTypes: value.scheduleTypes,
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
          <DialogTitle>Edit Work Schedule</DialogTitle>
          <DialogDescription>
            Select your preferred working days and schedule type.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="workScheduleDays">
              {(field) => (
                <FieldSet>
                  <FieldLegend variant="label">Preferred Days</FieldLegend>
                  <FieldGroup className="gap-3">
                    {WORK_SCHEDULE_DAY_OPTIONS.map((option) => {
                      const checked = field.state.value.includes(option.value);
                      return (
                        <Field key={option.value} orientation="horizontal">
                          <Checkbox
                            id={`day-${option.value}`}
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
                            htmlFor={`day-${option.value}`}
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

            <form.Field name="scheduleTypes">
              {(field) => (
                <FieldSet>
                  <FieldLegend variant="label">Schedule Type</FieldLegend>
                  <FieldGroup className="gap-3">
                    {SCHEDULE_TYPE_OPTIONS.map((option) => {
                      const checked = field.state.value.includes(option.value);
                      return (
                        <Field key={option.value} orientation="horizontal">
                          <Checkbox
                            id={`schedule-${option.value}`}
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
                            htmlFor={`schedule-${option.value}`}
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
