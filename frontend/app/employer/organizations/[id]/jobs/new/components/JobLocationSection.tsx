"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateJobFormApi } from "../hooks/use-create-job-form";

interface JobLocationSectionProps {
  form: CreateJobFormApi;
}

export function JobLocationSection({ form }: JobLocationSectionProps) {
  return (
    <>
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
    </>
  );
}
