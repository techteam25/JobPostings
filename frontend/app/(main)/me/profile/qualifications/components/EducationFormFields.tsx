"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";
import { PROGRAM_OPTIONS } from "@/schemas/educations";

function getFieldError(field: AnyFieldApi): string | undefined {
  return field.state.meta.errors?.length
    ? String(field.state.meta.errors[0])
    : undefined;
}

interface EducationFormFieldsProps {
  schoolNameField: AnyFieldApi;
  programField: AnyFieldApi;
  majorField: AnyFieldApi;
  startDateField: AnyFieldApi;
  endDateField: AnyFieldApi;
  graduatedField: AnyFieldApi;
}

export function EducationFormFields({
  schoolNameField,
  programField,
  majorField,
  startDateField,
  endDateField,
  graduatedField,
}: EducationFormFieldsProps) {
  const schoolError = getFieldError(schoolNameField);
  const programError = getFieldError(programField);
  const majorError = getFieldError(majorField);
  const startDateError = getFieldError(startDateField);
  const endDateError = getFieldError(endDateField);

  return (
    <FieldGroup>
      <Field data-invalid={!!schoolError || undefined}>
        <FieldLabel htmlFor={`school-${schoolNameField.name}`}>
          School Name *
        </FieldLabel>
        <Input
          id={`school-${schoolNameField.name}`}
          aria-invalid={!!schoolError || undefined}
          value={schoolNameField.state.value ?? ""}
          onChange={(e) => schoolNameField.handleChange(e.target.value)}
          onBlur={schoolNameField.handleBlur}
          placeholder="e.g., Massachusetts Institute of Technology"
        />
        {schoolError && <FieldError>{schoolError}</FieldError>}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field data-invalid={!!programError || undefined}>
          <FieldLabel htmlFor={`program-${programField.name}`}>
            Program *
          </FieldLabel>
          <Select
            value={programField.state.value ?? ""}
            onValueChange={(value) => programField.handleChange(value)}
          >
            <SelectTrigger
              id={`program-${programField.name}`}
              aria-invalid={!!programError || undefined}
            >
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {PROGRAM_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {programError && <FieldError>{programError}</FieldError>}
        </Field>

        <Field data-invalid={!!majorError || undefined}>
          <FieldLabel htmlFor={`major-${majorField.name}`}>Major *</FieldLabel>
          <Input
            id={`major-${majorField.name}`}
            aria-invalid={!!majorError || undefined}
            value={majorField.state.value ?? ""}
            onChange={(e) => majorField.handleChange(e.target.value)}
            onBlur={majorField.handleBlur}
            placeholder="e.g., Computer Science"
          />
          {majorError && <FieldError>{majorError}</FieldError>}
        </Field>
      </div>

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

        <Field data-invalid={!!endDateError || undefined}>
          <FieldLabel>
            End Date{graduatedField.state.value ? " *" : ""}
          </FieldLabel>
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
      </div>

      <Field orientation="horizontal">
        <Checkbox
          id={`graduated-${graduatedField.name}`}
          checked={graduatedField.state.value ?? false}
          onCheckedChange={(checked) =>
            graduatedField.handleChange(checked === true)
          }
        />
        <FieldLabel
          htmlFor={`graduated-${graduatedField.name}`}
          className="font-normal"
        >
          Graduated
        </FieldLabel>
      </Field>
    </FieldGroup>
  );
}
