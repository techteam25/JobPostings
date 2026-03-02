"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { createJobSchema } from "@/schemas/jobs";
import { useCreateJob } from "@/app/employer/organizations/hooks/use-manage-jobs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateJobFormProps {
  organizationId: number;
}

export function CreateJobForm({ organizationId }: CreateJobFormProps) {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateJob(organizationId);

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      city: "",
      state: "",
      country: "United States",
      zipcode: null as number | null,
      jobType: "full-time" as
        | "full-time"
        | "part-time"
        | "contract"
        | "volunteer"
        | "internship",
      compensationType: "paid" as
        | "paid"
        | "missionary"
        | "volunteer"
        | "stipend",
      isRemote: false,
      applicationDeadline: null as string | null,
      experience: "",
    },
    validators: {
      onChange: createJobSchema,
    },
    onSubmit: async (values) => {
      await mutateAsync(values.value);
      router.push(`/employer/organizations/${organizationId}/jobs`);
    },
  });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }}
      className="space-y-6"
    >
      {/* Title */}
      <form.Field
        name="title"
        validators={{
          onBlur: ({ value }) => {
            if (!value || value.length < 5)
              return "Title must be at least 5 characters";
            return undefined;
          },
        }}
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Job Title *</Label>
              <Input
                id={field.name}
                placeholder="e.g. Senior Software Engineer"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
              />
              {isInvalid && field.state.meta.errors.length > 0 && (
                <p className="text-destructive text-sm">
                  {typeof field.state.meta.errors[0] === "string"
                    ? field.state.meta.errors[0]
                    : (field.state.meta.errors[0] as any).message}
                </p>
              )}
            </div>
          );
        }}
      />

      {/* Description */}
      <form.Field
        name="description"
        validators={{
          onBlur: ({ value }) => {
            if (!value) return "Description is required";
            return undefined;
          },
        }}
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Job Description *</Label>
              <RichTextEditor
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
                placeholder="Describe the job responsibilities, requirements, and benefits..."
                height={200}
              />
              {isInvalid && field.state.meta.errors.length > 0 && (
                <p className="text-destructive text-sm">
                  {typeof field.state.meta.errors[0] === "string"
                    ? field.state.meta.errors[0]
                    : (field.state.meta.errors[0] as any).message}
                </p>
              )}
            </div>
          );
        }}
      />

      {/* City + State */}
      <div className="grid gap-6 md:grid-cols-2">
        <form.Field
          name="city"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return "City is required";
              return undefined;
            },
          }}
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <div className="space-y-2">
                <Label htmlFor={field.name}>City *</Label>
                <Input
                  id={field.name}
                  placeholder="e.g. San Francisco"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                />
                {isInvalid && field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {typeof field.state.meta.errors[0] === "string"
                      ? field.state.meta.errors[0]
                      : (field.state.meta.errors[0] as any).message}
                  </p>
                )}
              </div>
            );
          }}
        />

        <form.Field
          name="state"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <div className="space-y-2">
                <Label htmlFor={field.name}>State</Label>
                <Input
                  id={field.name}
                  placeholder="e.g. California"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                />
                {isInvalid && field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {typeof field.state.meta.errors[0] === "string"
                      ? field.state.meta.errors[0]
                      : (field.state.meta.errors[0] as any).message}
                  </p>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* Country + Zip Code */}
      <div className="grid gap-6 md:grid-cols-2">
        <form.Field
          name="country"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Country *</Label>
              <Input
                id={field.name}
                placeholder="e.g. United States"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        />

        <form.Field
          name="zipcode"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Zip Code</Label>
                <Input
                  id={field.name}
                  type="number"
                  placeholder="e.g. 94105"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  aria-invalid={isInvalid}
                />
                {isInvalid && field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {typeof field.state.meta.errors[0] === "string"
                      ? field.state.meta.errors[0]
                      : (field.state.meta.errors[0] as any).message}
                  </p>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* Job Type + Compensation Type */}
      <div className="grid gap-6 md:grid-cols-2">
        <form.Field
          name="jobType"
          children={(field) => (
            <div className="space-y-2">
              <Label>Job Type *</Label>
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as typeof field.state.value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        />

        <form.Field
          name="compensationType"
          children={(field) => (
            <div className="space-y-2">
              <Label>Compensation Type *</Label>
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as typeof field.state.value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select compensation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="missionary">Missionary</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="stipend">Stipend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      {/* Remote + Deadline */}
      <div className="grid gap-6 md:grid-cols-2">
        <form.Field
          name="isRemote"
          children={(field) => (
            <div className="flex items-center space-x-3 pt-7">
              <Switch
                id={field.name}
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked)}
              />
              <Label htmlFor={field.name}>Remote position</Label>
            </div>
          )}
        />

        <form.Field
          name="applicationDeadline"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Application Deadline</Label>
              <Input
                id={field.name}
                type="date"
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value || null)
                }
              />
            </div>
          )}
        />
      </div>

      {/* Experience */}
      <form.Field
        name="experience"
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Experience</Label>
            <Input
              id={field.name}
              placeholder="e.g. 3-5 years"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      />

      {/* Action Buttons */}
      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ canSubmit, isSubmitting }) => (
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(
                  `/employer/organizations/${organizationId}/jobs`,
                )
              }
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
                  Creating...
                </>
              ) : (
                "Post Job"
              )}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
