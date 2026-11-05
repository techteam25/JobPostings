"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "@/components/common/FieldInfo";
import type { RegistrationFormApi } from "../hooks/use-registration-form";

interface PersonalInfoFieldsProps {
  form: RegistrationFormApi;
}

export function PersonalInfoFields({ form }: PersonalInfoFieldsProps) {
  return (
    <>
      {/* Name Fields */}
      <div className="grid gap-4 xl:grid-cols-2">
        <form.Field
          name="firstName"
          children={(field) => (
            <div>
              <Label
                htmlFor={field.name}
                className="text-secondary-foreground mb-2 block text-xs font-semibold sm:text-sm"
              >
                First Name
              </Label>
              <Input
                id={field.name}
                name={field.name}
                placeholder="John"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="border-border w-full rounded-lg border px-4 py-3 transition outline-none"
              />
              <FieldInfo field={field} />
            </div>
          )}
        />

        <form.Field
          name="lastName"
          children={(field) => (
            <div>
              <Label
                htmlFor={field.name}
                className="text-secondary-foreground mb-2 block text-xs font-semibold sm:text-sm"
              >
                Last Name
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Doe"
                className="border-border w-full rounded-lg border px-4 py-3 transition outline-none"
              />
              <FieldInfo field={field} />
            </div>
          )}
        />
      </div>

      {/* Email */}
      <form.Field
        name="email"
        children={(field) => (
          <div>
            <Label
              htmlFor={field.name}
              className="text-secondary-foreground mb-2 block text-xs font-semibold sm:text-sm"
            >
              Email Address
            </Label>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              type="email"
              placeholder="john.doe@example.com"
              className="border-border focus-visible:ring-accent w-full rounded-lg border px-4 py-3 transition outline-none focus-visible:border-transparent focus-visible:ring-2"
            />
            <FieldInfo field={field} />
          </div>
        )}
      />
    </>
  );
}
