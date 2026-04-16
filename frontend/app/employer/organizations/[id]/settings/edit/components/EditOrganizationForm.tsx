"use client";

import { useRef } from "react";
import { useForm } from "@tanstack/react-form";
import { Building2, Loader2, Upload } from "lucide-react";
import { DynamicRichTextEditor } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useOrganization } from "../../../context/organization-context";
import { useUpdateOrganization } from "../../../hooks/use-update-organization";
import { useUploadLogo } from "@/app/employer/organizations/hooks/use-upload-logo";
import { useFetchOrganization } from "@/app/employer/organizations/hooks/use-fetch-organization";
import { editOrganizationSchema } from "@/schemas/organizations/edit-organization";
import Link from "next/link";
import { isPossiblePhoneNumber } from "libphonenumber-js";

export function EditOrganizationForm() {
  const { organization } = useOrganization();
  const { mutateAsync: updateOrg, isPending } = useUpdateOrganization(
    organization.id,
  );
  const { mutateAsync: uploadLogo, isPending: isUploading } = useUploadLogo(
    organization.id,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read from the same React Query cache the upload mutation writes to,
  // so the optimistic blob URL is picked up instantly.
  const { organization: freshOrg } = useFetchOrganization(
    String(organization.id),
  );
  const logoUrl = freshOrg?.logoUrl ?? organization.logoUrl;

  const form = useForm({
    defaultValues: {
      name: organization.name,
      url: organization.url,
      streetAddress: organization.streetAddress,
      city: organization.city,
      state: organization.state,
      country: organization.country,
      zipCode: organization.zipCode,
      phone: organization.phone ?? "",
      mission: organization.mission,
    },
    validators: {
      onChange: editOrganizationSchema,
    },
    onSubmit: async (values) => {
      await updateOrg(values.value);
    },
  });

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    await uploadLogo(file);
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }}
      className="flex flex-col gap-8"
    >
      {/* General Info */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid || undefined}>
                <FieldLabel htmlFor={field.name}>Company Name</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid || undefined}
                  placeholder="Enter company name"
                />
                {isInvalid && (
                  <FieldError
                    errors={field.state.meta.errors.map((e) =>
                      typeof e === "string" ? { message: e } : e,
                    )}
                  />
                )}
              </Field>
            );
          }}
        />

        <form.Field
          name="url"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid || undefined}>
                <FieldLabel htmlFor={field.name}>Website URL</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid || undefined}
                  placeholder="https://example.com"
                />
                {isInvalid && (
                  <FieldError
                    errors={field.state.meta.errors.map((e) =>
                      typeof e === "string" ? { message: e } : e,
                    )}
                  />
                )}
              </Field>
            );
          }}
        />
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <form.Field
          name="streetAddress"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid || undefined}>
                <FieldLabel htmlFor={field.name}>Street Address</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid || undefined}
                  placeholder="Enter street address"
                />
                {isInvalid && (
                  <FieldError
                    errors={field.state.meta.errors.map((e) =>
                      typeof e === "string" ? { message: e } : e,
                    )}
                  />
                )}
              </Field>
            );
          }}
        />

        <form.Field
          name="city"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid || undefined}>
                <FieldLabel htmlFor={field.name}>City</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid || undefined}
                  placeholder="Enter city"
                />
                {isInvalid && (
                  <FieldError
                    errors={field.state.meta.errors.map((e) =>
                      typeof e === "string" ? { message: e } : e,
                    )}
                  />
                )}
              </Field>
            );
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <form.Field
          name="state"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>State</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter state"
              />
            </Field>
          )}
        />

        <form.Field
          name="country"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid || undefined}>
                <FieldLabel htmlFor={field.name}>Country</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid || undefined}
                  placeholder="Enter country"
                />
                {isInvalid && (
                  <FieldError
                    errors={field.state.meta.errors.map((e) =>
                      typeof e === "string" ? { message: e } : e,
                    )}
                  />
                )}
              </Field>
            );
          }}
        />

        <form.Field
          name="zipCode"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Zip Code</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter zip code"
              />
            </Field>
          )}
        />
      </div>

      {/* Contact */}
      <form.Field
        name="phone"
        validators={{
          onBlur: ({ value }) => {
            if (!value) return undefined;
            if (!isPossiblePhoneNumber(value, "US"))
              return "Invalid phone number";
            return undefined;
          },
        }}
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field className="max-w-sm" data-invalid={isInvalid || undefined}>
              <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid || undefined}
                placeholder="Enter phone number"
              />
              {isInvalid && (
                <FieldError
                  errors={field.state.meta.errors.map((e) =>
                    typeof e === "string" ? { message: e } : e,
                  )}
                />
              )}
            </Field>
          );
        }}
      />

      {/* Logo Upload */}
      <div>
        <h3 className="mb-3 font-semibold">Upload Logo</h3>

        {/* Current logo preview */}
        <div className="mb-3 flex items-center gap-3">
          <div className="bg-muted flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={organization.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="text-muted-foreground h-8 w-8" />
            )}
          </div>
          {isUploading && (
            <p className="text-muted-foreground text-sm">Uploading...</p>
          )}
        </div>

        <div
          className="border-border bg-background cursor-pointer rounded-lg border-2 border-dashed p-12 text-center"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleLogoUpload(file);
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png,image/jpeg,image/jpg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Reset so the same file can be re-selected
              e.target.value = "";
              if (file) handleLogoUpload(file);
            }}
          />
          {isUploading ? (
            <Loader2 className="text-muted-foreground mx-auto mb-2 size-8 animate-spin" />
          ) : (
            <Upload className="text-muted-foreground mx-auto mb-2 size-8" />
          )}
          <p className="text-secondary-foreground text-sm">
            {isUploading ? "Uploading..." : "Click or drag to upload your logo"}
          </p>
          <p className="text-muted-foreground text-xs">
            PNG, JPG or JPEG, max 5MB
          </p>
        </div>
      </div>

      {/* Mission */}
      <form.Field
        name="mission"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid || undefined}>
              <FieldLabel htmlFor={field.name}>Company Mission</FieldLabel>
              <DynamicRichTextEditor
                defaultValue={field.state.value}
                onChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
                placeholder="Describe your company's mission..."
                height={150}
              />
              {isInvalid && (
                <FieldError
                  errors={field.state.meta.errors.map((e) =>
                    typeof e === "string" ? { message: e } : e,
                  )}
                />
              )}
            </Field>
          );
        }}
      />

      <Separator />

      {/* Actions */}
      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ canSubmit, isSubmitting }) => (
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link
                href={`/employer/organizations/${organization.id}/settings`}
              >
                Cancel
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
