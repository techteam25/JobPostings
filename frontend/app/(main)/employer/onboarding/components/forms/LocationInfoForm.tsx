"use client";

import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { countries } from "countries-list";
import states from "states-us";

import { TCreateOrganizationFormProps } from "@/lib/types";
import {
  type LocationCompanyInfoData,
  locationCompanyInfoSchema,
} from "@/schemas/organizations";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const defaultValues: LocationCompanyInfoData = {
  streetAddress: "",
  city: "",
  state: "",
  country: "",
  zipCode: "",
};
const LocationInfoForm = ({
  organization,
  setOrganizationData,
  formRef,
}: TCreateOrganizationFormProps) => {
  const form = useForm({
    defaultValues: {
      streetAddress: organization.streetAddress || defaultValues.streetAddress,
      city: organization.city || defaultValues.city,
      state: organization.state || defaultValues.state,
      country: organization.country || defaultValues.country,
      zipCode: organization.zipCode || defaultValues.zipCode,
    },
    validators: {
      onChange: locationCompanyInfoSchema,
    },
    onSubmit: (values) => {
      setOrganizationData({ ...organization, ...values.value });
    },
  });

  useEffect(() => {
    if (formRef) {
      formRef.current = form;
    }
  }, [form, formRef]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="col-span-2">
          <FieldGroup>
            <form.Field
              name="streetAddress"
              validators={{
                onBlur: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return "Street Address is required";
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Company Address *
                    </FieldLabel>
                    <Input
                      className="rounded-xl"
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="123 Main St"
                      autoComplete="off"
                      autoFocus
                    />
                    {isInvalid && field.state.meta.errors.length > 0 && (
                      <FieldError
                        errors={field.state.meta.errors.map((error) =>
                          typeof error === "string"
                            ? { message: error }
                            : error,
                        )}
                      />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </div>

        <div>
          <FieldGroup>
            <form.Field
              name="city"
              validators={{
                onBlur: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return "City is required";
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>City *</FieldLabel>
                    <Input
                      className="rounded-xl"
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="off"
                    />
                    {isInvalid && field.state.meta.errors.length > 0 && (
                      <FieldError
                        errors={field.state.meta.errors.map((error) =>
                          typeof error === "string"
                            ? { message: error }
                            : error,
                        )}
                      />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </div>
        <div>
          <FieldGroup>
            <form.Field
              name="state"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field orientation="responsive" data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      State (optional)
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger
                        id="form-select-state"
                        aria-invalid={isInvalid}
                        className="h-12 min-w-[120px] rounded-xl"
                      >
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent position="item-aligned">
                        <SelectGroup>
                          <SelectLabel>State</SelectLabel>
                          <SelectSeparator className="bg-input" />
                          <SelectItem value="N/A">N/A</SelectItem>
                          {states.map((state) => (
                            <SelectItem key={state.name} value={state.name}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </div>
        <div>
          <FieldGroup>
            <form.Field
              name="country"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field orientation="responsive" data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Country *</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger
                        id="form-select-country"
                        aria-invalid={isInvalid}
                        className="h-12 min-w-[120px] rounded-xl"
                      >
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent position="item-aligned">
                        <SelectGroup>
                          <SelectLabel>Countries</SelectLabel>
                          <SelectSeparator className="bg-input" />
                          {Object.entries(countries).map(([_, country]) => (
                            <SelectItem key={country.name} value={country.name}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </div>

        <div>
          <FieldGroup>
            <form.Field
              name="zipCode"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      ZipCode (optional)
                    </FieldLabel>
                    <Input
                      className="rounded-xl"
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="12345"
                      autoComplete="off"
                    />
                    {isInvalid && field.state.meta.errors.length > 0 && (
                      <FieldError
                        errors={field.state.meta.errors.map((error) =>
                          typeof error === "string"
                            ? { message: error }
                            : error,
                        )}
                      />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </div>
      </div>
    </form>
  );
};

export default LocationInfoForm;
