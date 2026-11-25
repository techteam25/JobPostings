"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePicker } from "@/components/ui/date-picker";
import { DynamicRichTextEditor } from "@/components/common/DynamicRichTextEditor";
import {
  getCompanyNameForKind,
  getEmploymentKind,
  type EmploymentKind,
} from "./employment-kind";

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
  const employmentKind = getEmploymentKind(companyNameField.state.value ?? "");
  const employmentKindOptions: { value: EmploymentKind; label: string }[] = [
    { value: "organization", label: "Organization or client" },
    { value: "self-employed", label: "Self-employed" },
    { value: "independent-contractor", label: "Independent contractor" },
  ];

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend variant="label">Type of work</FieldLegend>
        <RadioGroup
          value={employmentKind}
          onValueChange={(value) =>
            companyNameField.handleChange(
              getCompanyNameForKind(value as EmploymentKind),
            )
          }
          className="grid gap-3 sm:grid-cols-3"
        >
          {employmentKindOptions.map((option) => (
            <Field key={option.value} orientation="horizontal">
              <RadioGroupItem
                id={`${companyNameField.name}-${option.value}`}
                value={option.value}
              />
              <FieldLabel
                htmlFor={`${companyNameField.name}-${option.value}`}
                className="font-normal"
              >
                {option.label}
              </FieldLabel>
            </Field>
          ))}
        </RadioGroup>
        <FieldDescription>
          Choose self-employed or independent contractor if you did not work for
          one organization. This label will appear on your profile.
        </FieldDescription>
      </FieldSet>
      <div className="grid gap-4 sm:grid-cols-2">
        {employmentKind === "organization" && (
          <Field data-invalid={!!companyError || undefined}>
            <FieldLabel htmlFor={`company-${companyNameField.name}`}>
              Organization or client name *
            </FieldLabel>
            <Input
              id={`company-${companyNameField.name}`}
              aria-invalid={!!companyError || undefined}
              value={companyNameField.state.value ?? ""}
              onChange={(e) => companyNameField.handleChange(e.target.value)}
              onBlur={companyNameField.handleBlur}
              placeholder="e.g., a company or client"
            />
            {companyError && <FieldError>{companyError}</FieldError>}
          </Field>
        )}

        <Field
          data-invalid={!!jobTitleError || undefined}
          className={employmentKind !== "organization" ? "sm:col-span-2" : ""}
        >
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
