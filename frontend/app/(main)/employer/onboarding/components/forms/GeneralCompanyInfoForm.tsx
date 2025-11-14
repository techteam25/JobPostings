"use client";

import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";

import { TCreateOrganizationFormProps } from "@/lib/types";
import {
  type GeneralCompanyInfoData,
  generalCompanyInfoSchema,
} from "@/schemas/organizations";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/common";

const defaultValues: GeneralCompanyInfoData = {
  name: "",
  industry: "",
  size: "",
  mission: "",
};
const GeneralCompanyInfoForm = ({
  organization,
  setOrganizationData,
  formRef,
}: TCreateOrganizationFormProps) => {
  const form = useForm({
    defaultValues: {
      name: organization.name || defaultValues.name,
      industry: organization.industry || defaultValues.industry,
      size: organization.size || defaultValues.size,
      mission: organization.mission || defaultValues.mission,
    },
    validators: {
      onChange: generalCompanyInfoSchema,
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
      <FieldGroup>
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="col-span-2">
            <form.Field
              name="name"
              validators={{
                onBlur: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return "Name is required";
                  }
                  if (value.length > 100) {
                    return "Name can't be longer than 100 characters";
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Company Name *</FieldLabel>
                    <Input
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
          </div>

          <div>
            <form.Field
              name="industry"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Industry (optional)
                    </FieldLabel>
                    <Input
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
          </div>
          <div>
            <form.Field
              name="size"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Company Size (optional)
                    </FieldLabel>
                    <Input
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
          </div>
          <div className="col-span-2">
            <form.Field
              name="mission"
              validators={{
                onBlur: ({ value }) => {
                  // Strip HTML tags to check if there's actual content
                  const textContent = value.replace(/<[^>]*>/g, "").trim();
                  if (!textContent || textContent.length === 0) {
                    return "Mission is required";
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Mission *</FieldLabel>
                    <RichTextEditor
                      value={field.state.value}
                      onChange={(value) => field.handleChange(value)}
                      onBlur={field.handleBlur}
                      placeholder="Describe your company's mission..."
                      height={150}
                      className={isInvalid ? "data-[invalid=true]" : ""}
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
          </div>
        </div>
      </FieldGroup>
    </form>
  );
};

export default GeneralCompanyInfoForm;
