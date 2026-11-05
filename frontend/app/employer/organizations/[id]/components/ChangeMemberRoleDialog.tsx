"use client";

import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  assignableMemberRoleSchema,
  changeMemberRoleSchema,
  type AssignableMemberRole,
} from "@/schemas/invitations";
import { Field, FieldLabel } from "@/components/ui/field";
import type { Member } from "@/lib/types";

interface ChangeMemberRoleDialogProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (role: AssignableMemberRole) => Promise<void>;
  isPending?: boolean;
}

export function ChangeMemberRoleDialog({
  member,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: ChangeMemberRoleDialogProps) {
  const form = useForm({
    defaultValues: {
      role: "member" as AssignableMemberRole,
    },
    validators: {
      onChange: changeMemberRoleSchema,
    },
    onSubmit: async ({ value }) => {
      await onConfirm(value.role);
    },
  });

  useEffect(() => {
    if (member && member.role !== "owner") {
      form.setFieldValue("role", member.role);
    }
  }, [member, form]);

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Update the role for{" "}
            <span className="font-medium">{member.memberName}</span>.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <form.Field
            name="role"
            validators={{
              onChange: ({ value }) => {
                const result = assignableMemberRoleSchema.safeParse(value);
                return result.success ? undefined : "Please select a role";
              },
            }}
            children={(field) => (
              <Field className="flex flex-col gap-2">
                <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as AssignableMemberRole)
                  }
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
              role: state.values.role,
            })}
          >
            {({ canSubmit, isSubmitting, role }) => (
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending || isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !canSubmit ||
                    isSubmitting ||
                    isPending ||
                    role === member.role
                  }
                >
                  {isPending || isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Role"
                  )}
                </Button>
              </div>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
