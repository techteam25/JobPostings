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
      onBlur: generalCompanyInfoSchema,
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
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Company Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="off"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
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
                    <FieldLabel htmlFor={field.name}>Industry</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="off"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
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
                    <FieldLabel htmlFor={field.name}>Company Size</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="off"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </div>
          <div className="col-span-2">
            <form.Field
              name="mission"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Mission</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="off"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
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
