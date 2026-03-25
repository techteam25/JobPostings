"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";
import { DynamicRichTextEditor } from "@/components/common/DynamicRichTextEditor";

function getFieldError(field: AnyFieldApi): string | undefined {
  return field.state.meta.errors?.length
    ? String(field.state.meta.errors[0])
    : undefined;
}

interface WorkExperienceFormFieldsProps {
  companyNameField: AnyFieldApi;
  jobTitleField: AnyFieldApi;
  descriptionField: AnyFieldApi;
  startDateField: AnyFieldApi;
  endDateField: AnyFieldApi;
  currentField: AnyFieldApi;
}

export function WorkExperienceFormFields({
  companyNameField,
  jobTitleField,
  descriptionField,
  startDateField,
  endDateField,
  currentField,
}: WorkExperienceFormFieldsProps) {
  const companyError = getFieldError(companyNameField);
  const jobTitleError = getFieldError(jobTitleField);
  const startDateError = getFieldError(startDateField);
  const endDateError = getFieldError(endDateField);
  const isCurrent = currentField.state.value ?? false;

  return (
    <FieldGroup>
      <div className="grid grid-cols-2 gap-4">
        <Field data-invalid={!!companyError || undefined}>
          <FieldLabel htmlFor={`company-${companyNameField.name}`}>
            Company Name *
          </FieldLabel>
          <Input
            id={`company-${companyNameField.name}`}
            aria-invalid={!!companyError || undefined}
            value={companyNameField.state.value ?? ""}
            onChange={(e) => companyNameField.handleChange(e.target.value)}
            onBlur={companyNameField.handleBlur}
            placeholder="e.g., Google"
          />
          {companyError && <FieldError>{companyError}</FieldError>}
        </Field>

        <Field data-invalid={!!jobTitleError || undefined}>
          <FieldLabel htmlFor={`title-${jobTitleField.name}`}>
            Job Title *
          </FieldLabel>
          <Input
            id={`title-${jobTitleField.name}`}
            aria-invalid={!!jobTitleError || undefined}
            value={jobTitleField.state.value ?? ""}
            onChange={(e) => jobTitleField.handleChange(e.target.value)}
            onBlur={jobTitleField.handleBlur}
            placeholder="e.g., Software Engineer"
          />
          {jobTitleError && <FieldError>{jobTitleError}</FieldError>}
        </Field>
      </div>

      <Field>
        <FieldLabel>Description</FieldLabel>
        <DynamicRichTextEditor
          defaultValue={descriptionField.state.value ?? ""}
          onChange={(value) => descriptionField.handleChange(value)}
          onBlur={descriptionField.handleBlur}
          placeholder="Describe your role and responsibilities..."
          height="150px"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field data-invalid={!!startDateError || undefined}>
          <FieldLabel>Start Date *</FieldLabel>
          <DatePicker
            value={
              startDateField.state.value
                ? new Date(startDateField.state.value)
                : undefined
            }
            onChange={(date) =>
              startDateField.handleChange(date ? date.toISOString() : "")
            }
            placeholder="Start date"
          />
          {startDateError && <FieldError>{startDateError}</FieldError>}
        </Field>

        {!isCurrent && (
          <Field data-invalid={!!endDateError || undefined}>
            <FieldLabel>End Date *</FieldLabel>
            <DatePicker
              value={
                endDateField.state.value
                  ? new Date(endDateField.state.value)
                  : undefined
              }
              onChange={(date) =>
                endDateField.handleChange(date ? date.toISOString() : "")
              }
              placeholder="End date"
            />
            {endDateError && <FieldError>{endDateError}</FieldError>}
          </Field>
        )}
      </div>

      <Field orientation="horizontal">
        <Checkbox
          id={`current-${currentField.name}`}
          checked={isCurrent}
          onCheckedChange={(checked) => {
            currentField.handleChange(checked === true);
            if (checked === true) {
              endDateField.handleChange(undefined);
            }
          }}
        />
        <FieldLabel
          htmlFor={`current-${currentField.name}`}
          className="font-normal"
        >
          I currently work here
        </FieldLabel>
      </Field>
    </FieldGroup>
  );
}
