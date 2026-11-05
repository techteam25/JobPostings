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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WorkArea } from "@/schemas/job-preferences";
import { useUpdateWorkAreas } from "../hooks/use-work-areas";

interface WorkAreasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWorkAreaIds: number[];
  availableWorkAreas: WorkArea[];
}

export function WorkAreasDialog({
  open,
  onOpenChange,
  defaultWorkAreaIds,
  availableWorkAreas,
}: WorkAreasDialogProps) {
  const mutation = useUpdateWorkAreas();

  const form = useForm({
    defaultValues: {
      workAreaIds: defaultWorkAreaIds,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        workAreaIds: value.workAreaIds,
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
          <DialogTitle>Edit Work Areas</DialogTitle>
          <DialogDescription>
            Select your preferred work areas to be matched with relevant roles.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="workAreaIds">
              {(field) => (
                <FieldSet>
                  <FieldLegend variant="label">Work Areas</FieldLegend>
                  <ScrollArea className="h-72">
                    <FieldGroup className="gap-3 pr-4">
                      {availableWorkAreas.map((area) => {
                        const checked = field.state.value.includes(area.id);
                        return (
                          <Field key={area.id} orientation="horizontal">
                            <Checkbox
                              id={`work-area-${area.id}`}
                              checked={checked}
                              onCheckedChange={(isChecked) => {
                                const current = field.state.value;
                                field.handleChange(
                                  isChecked
                                    ? [...current, area.id]
                                    : current.filter(
                                        (id: number) => id !== area.id,
                                      ),
                                );
                              }}
                            />
                            <FieldLabel
                              htmlFor={`work-area-${area.id}`}
                              className="font-normal"
                            >
                              {area.name}
                            </FieldLabel>
                          </Field>
                        );
                      })}
                    </FieldGroup>
                  </ScrollArea>
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
