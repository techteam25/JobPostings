"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DynamicRichTextEditor } from "@/components/common";
import type { CreateJobFormApi } from "../hooks/use-create-job-form";

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
              <DynamicRichTextEditor
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
    </>
  );
}
