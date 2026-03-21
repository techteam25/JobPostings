"use client";

import { Input } from "@/components/ui/input";
import { DynamicRichTextEditor } from "@/components/common";
import type { CreateJobFormApi } from "../hooks/use-create-job-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface JobBasicInfoSectionProps {
  form: CreateJobFormApi;
}

export function JobBasicInfoSection({ form }: JobBasicInfoSectionProps) {
  return (
    <>
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
            <Field className="space-y-2" data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Job Title *</FieldLabel>
              <Input
                id={field.name}
                placeholder="e.g. Senior Software Engineer"
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
            <Field className="space-y-2" data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Job Description *</FieldLabel>
              <DynamicRichTextEditor
                defaultValue={field.state.value}
                onChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
                placeholder="Describe the job responsibilities, requirements, and benefits..."
                height={200}
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
    </>
  );
}
