"use client";

import { Input } from "@/components/ui/input";
import type { CreateJobFormApi } from "../hooks/use-create-job-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

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
              <Field className="space-y-2" data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>City *</FieldLabel>
                <Input
                  id={field.name}
                  placeholder="e.g. San Francisco"
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
          name="state"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field className="space-y-2" data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>State</FieldLabel>
                <Input
                  id={field.name}
                  placeholder="e.g. California"
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
      </div>

      {/* Country + Zip Code */}
      <div className="grid gap-6 md:grid-cols-2">
        <form.Field
          name="country"
          children={(field) => (
            <Field className="space-y-2">
              <FieldLabel htmlFor={field.name}>Country *</FieldLabel>
              <Input
                id={field.name}
                placeholder="e.g. United States"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        />

        <form.Field
          name="zipcode"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field className="space-y-2" data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Zip Code</FieldLabel>
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
      </div>
    </>
  );
}
