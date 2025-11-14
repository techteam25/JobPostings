import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";

import { TCreateOrganizationFormProps } from "@/lib/types";
import {
  type ContactCompanyInfoData,
  contactCompanyInfoSchema,
} from "@/schemas/organizations";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const defaultValues: ContactCompanyInfoData = {
  phone: "",
  url: "",
  logo: undefined,
};
const ContactInfoForm = ({
  organization,
  setOrganizationData,
  formRef,
}: TCreateOrganizationFormProps) => {
  const form = useForm({
    defaultValues: {
      phone: organization.phone || defaultValues.phone,
      url: organization.url || defaultValues.url,
      logo: organization.logo || defaultValues.logo,
    },
    validators: {
      onChange: contactCompanyInfoSchema,
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
        <div>
          <FieldGroup>
            <form.Field
              name="logo"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field
                    data-invalid={isInvalid}
                    className="grid w-full max-w-sm items-center gap-3"
                  >
                    <FieldLabel htmlFor={field.name}>
                      Company Logo (optional)
                    </FieldLabel>
                    <Input
                      className="h-auto rounded-xl"
                      id={field.name}
                      name={field.name}
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        field.handleChange(
                          e.target.files ? e.target.files[0] : undefined,
                        )
                      }
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

        <div className="col-span-2">
          <FieldGroup>
            <form.Field
              name="phone"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Contact Phone (optional)
                    </FieldLabel>
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

        <div className="col-span-2">
          <FieldGroup>
            <form.Field
              name="url"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Company Website (optional)
                    </FieldLabel>
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
      </div>
    </form>
  );
};

export default ContactInfoForm;
