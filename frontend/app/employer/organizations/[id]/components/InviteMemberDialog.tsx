"use client";

import { useForm } from "@tanstack/react-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { sendInvitationSchema } from "@/schemas/invitations";
import { useSendInvitation } from "@/app/employer/organizations/hooks/use-manage-invitations";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface InviteMemberDialogProps {
  organizationId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({
  organizationId,
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const { mutateAsync, isPending } = useSendInvitation(organizationId);

  const form = useForm({
    defaultValues: {
      email: "",
      role: "member" as "admin" | "recruiter" | "member",
    },
    validators: {
      onChange: sendInvitationSchema,
    },
    onSubmit: async (values) => {
      await mutateAsync(values.value);
      form.reset();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a New Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization.
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
            name="email"
            validators={{
              onBlur: ({ value }) => {
                if (!value) return "Email is required";
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                  return "Invalid email address";
                return undefined;
              },
            }}
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field className="flex flex-col gap-2" data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    placeholder="colleague@example.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && (
                    <FieldError
                      errors={field.state.meta.errors.map((e) =>
                        typeof e === "string" ? { message: e } : e,
                      )}
                    />
                  )}
                </Field>
              );
            }}
          />

          <form.Field
            name="role"
            children={(field) => (
              <Field className="flex flex-col gap-2">
                <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(
                      value as "admin" | "recruiter" | "member",
                    )
                  }
                >
                  <SelectTrigger>
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
            })}
          >
            {({ canSubmit, isSubmitting }) => (
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || isPending}
                  className="bg-primary/90 hover:bg-primary"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Invitation"
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
