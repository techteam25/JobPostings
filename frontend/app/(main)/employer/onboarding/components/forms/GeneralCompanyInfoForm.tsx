"use client";

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
      setOrganizationData({ ...organization, ...values });
    },
  });
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
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Company Name</FieldLabel>
                    <Input
                      className="rounded-xl"
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
          </FieldGroup>
        </div>

        <div>
          <FieldGroup>
            <form.Field
              name="industry"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Industry</FieldLabel>
                    <Input
                      className="rounded-xl"
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
          </FieldGroup>
        </div>
        <div>
          <FieldGroup>
            <form.Field
              name="size"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Company Size</FieldLabel>
                    <Input
                      className="rounded-xl"
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
          </FieldGroup>
        </div>
        <div className="col-span-2">
          <FieldGroup>
            <form.Field
              name="mission"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Mission</FieldLabel>
                    <Input
                      className="rounded-xl"
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
          </FieldGroup>
        </div>
      </div>
    </form>
  );
};

export default GeneralCompanyInfoForm;
