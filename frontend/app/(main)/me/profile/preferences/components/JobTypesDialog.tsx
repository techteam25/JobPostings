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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  JOB_TYPE_OPTIONS,
  VOLUNTEER_HOURS_OPTIONS,
} from "@/schemas/job-preferences";
import { useUpdateJobPreferences } from "../hooks/use-job-preferences";

interface JobTypesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultJobTypes: string[];
  defaultVolunteerHours: string | null;
}

export function JobTypesDialog({
  open,
  onOpenChange,
  defaultJobTypes,
  defaultVolunteerHours,
}: JobTypesDialogProps) {
  const mutation = useUpdateJobPreferences();

  const form = useForm({
    defaultValues: {
      jobTypes: defaultJobTypes,
      volunteerHoursPerWeek: defaultVolunteerHours ?? "",
    },
    onSubmit: async ({ value }) => {
      const includesVolunteer = value.jobTypes.includes("volunteer");
      await mutation.mutateAsync({
        jobTypes: value.jobTypes,
        volunteerHoursPerWeek: includesVolunteer
          ? value.volunteerHoursPerWeek || undefined
          : undefined,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Job Types</DialogTitle>
          <DialogDescription>
            Select the types of employment you&apos;re interested in.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="jobTypes">
              {(field) => (
                <FieldSet>
                  <FieldLegend variant="label">Job Types</FieldLegend>
                  <FieldGroup className="gap-3">
                    {JOB_TYPE_OPTIONS.map((option) => {
                      const checked = field.state.value.includes(option.value);
                      return (
                        <Field key={option.value} orientation="horizontal">
                          <Checkbox
                            id={`job-type-${option.value}`}
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
                            htmlFor={`job-type-${option.value}`}
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

            <form.Field name="jobTypes">
              {(field) =>
                field.state.value.includes("volunteer") ? (
                  <form.Field name="volunteerHoursPerWeek">
                    {(hoursField) => (
                      <Field>
                        <FieldLabel>Volunteer Hours Per Week</FieldLabel>
                        <Select
                          value={hoursField.state.value}
                          onValueChange={hoursField.handleChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select hours per week" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {VOLUNTEER_HOURS_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  </form.Field>
                ) : null
              }
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
