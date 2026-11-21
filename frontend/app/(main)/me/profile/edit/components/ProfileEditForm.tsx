"use client";

import { useState, useRef, useCallback } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { countries } from "countries-list";
import states from "states-us";
import { toast } from "sonner";
import { Loader2, Pencil, FileText, Upload } from "lucide-react";

import { ApiError, type UserWithProfile } from "@/lib/types";
import {
  isProfilePhonePossible,
  profileEditSchema,
} from "../schemas/profile-edit.schema";
import { useUpdateProfile } from "../hooks/use-update-profile";
import { useUploadProfilePicture } from "../hooks/use-upload-profile-picture";
import { useUploadResume } from "../hooks/use-upload-resume";
import { useCurrentUserProfile } from "@/app/(main)/hooks/use-current-user-profile";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { UrlInput } from "@/components/ui/url-input";
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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { DynamicRichTextEditor } from "@/components/common/DynamicRichTextEditor";
import { cn } from "@/lib/utils";
import { useFocusHighlight } from "@/lib/use-focus-highlight";

const FOCUS_ID_MAP: Record<string, string> = {
  photo: "photo-field",
  phone: "phoneNumber",
  location: "city",
  bio: "bio-field",
  resume: "resume-field",
};

interface ProfileEditFormProps {
  user: UserWithProfile;
}

const BIO_MAX = 1000;
const BIO_MIN = 10;

const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function ProfileEditForm({ user }: ProfileEditFormProps) {
  const profile = user.profile;
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const {
    mutateAsync: uploadPicture,
    isPending: isUploading,
    isProcessing: isProcessingPicture,
    processingStatus: pictureStatus,
    statusError: pictureStatusError,
    retryStatus: retryPictureStatus,
    previewUrl,
  } = useUploadProfilePicture();
  const {
    mutateAsync: uploadResume,
    isPending: isUploadingResume,
    isProcessing: isProcessingResume,
    processingStatus: resumeStatus,
    statusError: resumeStatusError,
    retryStatus: retryResumeStatus,
    pendingFilename,
  } = useUploadResume();
  const [bioCharCount, setBioCharCount] = useState(0);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const avatarInitials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const { data: freshProfile } = useCurrentUserProfile();

  const freshProfilePicture = freshProfile?.success
    ? freshProfile.data.profile?.profilePicture
    : undefined;
  const avatarSrc =
    previewUrl ||
    freshProfilePicture ||
    profile?.profilePicture ||
    user.image ||
    undefined;

  const clearServerError = (field: string) => {
    setServerErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleProfilePictureUpload = async (file: File) => {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Please upload a PNG or JPEG image");
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    try {
      await uploadPicture(file);
    } catch {
      // The mutation displays the server error.
    }
  };

  const handleResumeUpload = useCallback(
    async (file: File) => {
      if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
        toast.error("Please upload a PDF or Word document");
        return;
      }
      if (file.size === 0 || file.size > 10 * 1024 * 1024) {
        toast.error("File must be under 10 MB");
        return;
      }
      try {
        await uploadResume(file);
      } catch {
        // The mutation displays the server error.
      }
    },
    [uploadResume],
  );

  const currentResumeUrl = freshProfile?.success
    ? freshProfile.data.profile?.resumeUrl
    : profile?.resumeUrl;

  const resumeMetadata = freshProfile?.success
    ? freshProfile.data.profile?.fileMetadata?.find(
        (m) => m.url === currentResumeUrl,
      )
    : profile?.fileMetadata?.find((m) => m.url === currentResumeUrl);

  const form = useForm({
    defaultValues: {
      fullName: user.fullName ?? "",
      bio: profile?.bio ?? "",
      phoneNumber: profile?.phoneNumber ?? "",
      city: profile?.city ?? "",
      state: profile?.state ?? "",
      country: profile?.country ?? "United States",
      linkedinUrl: profile?.linkedinUrl ?? "",
      portfolioUrl: profile?.portfolioUrl ?? "",
    },
    onSubmit: async ({ value }) => {
      const result = profileEditSchema.safeParse(value);

      if (!result.success) {
        setServerErrors(
          Object.fromEntries(
            result.error.issues.map((issue) => [
              String(issue.path[0]),
              issue.message,
            ]),
          ),
        );
        toast.error(
          result.error.issues[0]?.message || "Please check your form inputs",
        );
        return;
      }

      setServerErrors({});
      try {
        await updateProfile(result.data);
      } catch (error) {
        if (error instanceof ApiError && error.details?.length) {
          const fields = Object.fromEntries(
            error.details.map((detail) => [
              detail.field.replace(/^body\./, ""),
              detail.message,
            ]),
          );
          setServerErrors(fields);
          toast.error(error.details[0]?.message || error.message);
        } else {
          toast.error(
            error instanceof Error ? error.message : "Failed to save profile",
          );
        }
      }
    },
  });

  const country = useStore(form.store, (s) => s.values.country);
  const isUS = country === "United States";

  useFocusHighlight(FOCUS_ID_MAP);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex flex-col gap-8"
    >
      {/* Profile Picture */}
      <div id="photo-field" className="flex flex-col items-center gap-2">
        <div className="relative">
          <Avatar className="h-24 w-24">
            {avatarSrc && <AvatarImage src={avatarSrc} alt={user.fullName} />}
            <AvatarFallback className="bg-secondary text-primary-foreground text-2xl">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>

          {/* Loading overlay */}
          {(isUploading || isProcessingPicture) && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Loader2 className="size-6 animate-spin text-white" />
            </div>
          )}

          {/* Pencil edit button */}
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isProcessingPicture}
            className="border-background absolute -right-1 -bottom-1 size-8 rounded-full border-2 shadow-sm"
            aria-label="Change profile picture"
          >
            <Pencil className="size-3.5" />
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/jpg"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              // Reset so the same file can be re-selected
              e.target.value = "";
              if (file) await handleProfilePictureUpload(file);
            }}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          {isProcessingPicture
            ? pictureStatus === "processing"
              ? "Processing your picture..."
              : "Picture queued for processing..."
            : "PNG, JPG or JPEG, max 5MB"}
        </p>
        {pictureStatusError && isProcessingPicture && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => void retryPictureStatus()}
          >
            Could not check upload status. Retry
          </Button>
        )}
      </div>

      {/* Display Name */}
      <FieldGroup>
        <form.Field
          name="fullName"
          validators={{
            onBlur: ({ value }) => {
              if (!value || value.trim().length === 0)
                return "Display name is required";
              if (value.length > 100)
                return "Display name must not exceed 100 characters";
              return undefined;
            },
          }}
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid || Boolean(serverErrors.fullName)}>
                <FieldLabel htmlFor={field.name}>Display Name *</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    clearServerError("fullName");
                    field.handleChange(e.target.value);
                  }}
                  aria-invalid={isInvalid || Boolean(serverErrors.fullName)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
                {isInvalid && field.state.meta.errors.length > 0 && (
                  <FieldError
                    errors={field.state.meta.errors.map((error) =>
                      typeof error === "string" ? { message: error } : error,
                    )}
                  />
                )}
                {serverErrors.fullName && (
                  <FieldError errors={[{ message: serverErrors.fullName }]} />
                )}
              </Field>
            );
          }}
        />
      </FieldGroup>

      {/* Bio with Character Counter */}
      <FieldGroup>
        <form.Field
          name="bio"
          children={(field) => {
            const isOverLimit = bioCharCount > BIO_MAX;
            const isUnderMin = bioCharCount > 0 && bioCharCount < BIO_MIN;

            return (
              <Field
                id="bio-field"
                data-invalid={
                  isOverLimit || isUnderMin || Boolean(serverErrors.bio)
                }
              >
                <FieldLabel htmlFor={field.name}>Bio</FieldLabel>
                <DynamicRichTextEditor
                  defaultValue={field.state.value}
                  onChange={(value) => {
                    clearServerError("bio");
                    field.handleChange(value);
                  }}
                  onBlur={field.handleBlur}
                  onCharacterCount={setBioCharCount}
                  characterLimit={BIO_MAX}
                  placeholder="Tell us about yourself..."
                  height="150px"
                />
                <div className="flex items-center justify-between">
                  {isUnderMin && (
                    <p className="text-destructive text-sm">
                      Bio must be at least {BIO_MIN} characters
                    </p>
                  )}
                  {isOverLimit && (
                    <p className="text-destructive text-sm">
                      Bio must not exceed {BIO_MAX} characters
                    </p>
                  )}
                  {!isUnderMin && !isOverLimit && <span />}
                  <p
                    className={cn(
                      "text-muted-foreground text-sm",
                      isOverLimit && "text-destructive",
                      isUnderMin && "text-destructive",
                    )}
                  >
                    {bioCharCount} / {BIO_MAX}
                  </p>
                </div>
                {serverErrors.bio && (
                  <FieldError errors={[{ message: serverErrors.bio }]} />
                )}
              </Field>
            );
          }}
        />
      </FieldGroup>

      {/* Resume Upload */}
      <div id="resume-field" className="flex flex-col gap-2">
        <p className="text-sm font-medium">Resume</p>
        <div className="border-border flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded bg-blue-50">
              <FileText className="size-5 text-blue-600" />
            </div>
            <div>
              {pendingFilename ? (
                <>
                  <p className="text-foreground text-sm font-medium">
                    {pendingFilename}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {resumeStatus === "processing"
                      ? "Processing upload..."
                      : "Upload queued..."}
                  </p>
                </>
              ) : currentResumeUrl && resumeMetadata ? (
                <>
                  <p className="text-foreground text-sm font-medium">
                    {resumeMetadata.filename}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {(resumeMetadata.size / 1024).toFixed(0)} KB
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No resume uploaded
                </p>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => resumeInputRef.current?.click()}
            disabled={isUploadingResume || isProcessingResume}
          >
            {isUploadingResume || isProcessingResume ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Upload className="mr-2 size-4" />
            )}
            {isProcessingResume
              ? "Processing"
              : currentResumeUrl
                ? "Replace"
                : "Upload"}
          </Button>
          <input
            ref={resumeInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) await handleResumeUpload(file);
            }}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          PDF, DOC or DOCX, max 10 MB
        </p>
        {resumeStatusError && isProcessingResume && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => void retryResumeStatus()}
          >
            Could not check upload status. Retry
          </Button>
        )}
      </div>

      <Separator />

      {/* Contact Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Phone Number */}
        <FieldGroup>
          <form.Field
            name="phoneNumber"
            validators={{
              onBlur: ({ value }) => {
                if (!value) return undefined;
                if (!isProfilePhonePossible(value, country))
                  return "Invalid phone number";
                return undefined;
              },
            }}
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field
                  data-invalid={isInvalid || Boolean(serverErrors.phoneNumber)}
                >
                  <FieldLabel htmlFor={field.name}>Phone Number</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      clearServerError("phoneNumber");
                      field.handleChange(e.target.value);
                    }}
                    aria-invalid={
                      isInvalid || Boolean(serverErrors.phoneNumber)
                    }
                    placeholder={
                      isUS ? "(123) 456-7890" : "Include country code if needed"
                    }
                    autoComplete="tel"
                  />
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <FieldError
                      errors={field.state.meta.errors.map((error) =>
                        typeof error === "string" ? { message: error } : error,
                      )}
                    />
                  )}
                  {serverErrors.phoneNumber && (
                    <FieldError
                      errors={[{ message: serverErrors.phoneNumber }]}
                    />
                  )}
                </Field>
              );
            }}
          />
        </FieldGroup>

        {/* City */}
        <FieldGroup>
          <form.Field
            name="city"
            children={(field) => (
              <Field data-invalid={Boolean(serverErrors.city)}>
                <FieldLabel htmlFor={field.name}>City</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    clearServerError("city");
                    field.handleChange(e.target.value);
                  }}
                  placeholder="Your city"
                  autoComplete="address-level2"
                />
                {serverErrors.city && (
                  <FieldError errors={[{ message: serverErrors.city }]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {/* Country */}
        <FieldGroup>
          <form.Field
            name="country"
            children={(field) => (
              <Field data-invalid={Boolean(serverErrors.country)}>
                <FieldLabel htmlFor={field.name}>Country</FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(value: string) => {
                    clearServerError("country");
                    field.handleChange(value);
                    // Clear state when switching away from US
                    if (value !== "United States") {
                      form.setFieldValue("state", "");
                    }
                  }}
                >
                  <SelectTrigger id="form-select-country">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    <SelectGroup>
                      <SelectLabel>Countries</SelectLabel>
                      <SelectSeparator className="bg-input" />
                      {Object.entries(countries)
                        .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                        .map(([code, country]) => (
                          <SelectItem key={code} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {serverErrors.country && (
                  <FieldError errors={[{ message: serverErrors.country }]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {/* State */}
        <FieldGroup>
          <form.Field
            name="state"
            children={(field) => (
              <Field
                data-disabled={!isUS}
                data-invalid={Boolean(serverErrors.state)}
              >
                <FieldLabel htmlFor={field.name}>State</FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(value) => {
                    clearServerError("state");
                    field.handleChange(value);
                  }}
                  disabled={!isUS}
                >
                  <SelectTrigger id="form-select-state">
                    <SelectValue placeholder={isUS ? "Select State" : "N/A"} />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    <SelectGroup>
                      <SelectLabel>State</SelectLabel>
                      <SelectSeparator className="bg-input" />
                      {states.map((state) => (
                        <SelectItem key={state.name} value={state.name}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {serverErrors.state && (
                  <FieldError errors={[{ message: serverErrors.state }]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </div>

      <Separator />

      {/* Social Links */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* LinkedIn URL */}
        <FieldGroup>
          <form.Field
            name="linkedinUrl"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field
                  data-invalid={isInvalid || Boolean(serverErrors.linkedinUrl)}
                >
                  <FieldLabel htmlFor={field.name}>LinkedIn URL</FieldLabel>
                  <UrlInput
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(value) => {
                      clearServerError("linkedinUrl");
                      field.handleChange(value);
                    }}
                    invalid={isInvalid}
                    aria-invalid={
                      isInvalid || Boolean(serverErrors.linkedinUrl)
                    }
                    placeholder="linkedin.com/in/yourprofile"
                    autoComplete="url"
                  />
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <FieldError
                      errors={field.state.meta.errors.map((error) =>
                        typeof error === "string" ? { message: error } : error,
                      )}
                    />
                  )}
                  {serverErrors.linkedinUrl && (
                    <FieldError
                      errors={[{ message: serverErrors.linkedinUrl }]}
                    />
                  )}
                </Field>
              );
            }}
          />
        </FieldGroup>

        {/* Portfolio URL */}
        <FieldGroup>
          <form.Field
            name="portfolioUrl"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field
                  data-invalid={isInvalid || Boolean(serverErrors.portfolioUrl)}
                >
                  <FieldLabel htmlFor={field.name}>Portfolio URL</FieldLabel>
                  <UrlInput
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(value) => {
                      clearServerError("portfolioUrl");
                      field.handleChange(value);
                    }}
                    invalid={isInvalid}
                    aria-invalid={
                      isInvalid || Boolean(serverErrors.portfolioUrl)
                    }
                    placeholder="yourportfolio.com"
                    autoComplete="url"
                  />
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <FieldError
                      errors={field.state.meta.errors.map((error) =>
                        typeof error === "string" ? { message: error } : error,
                      )}
                    />
                  )}
                  {serverErrors.portfolioUrl && (
                    <FieldError
                      errors={[{ message: serverErrors.portfolioUrl }]}
                    />
                  )}
                </Field>
              );
            }}
          />
        </FieldGroup>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <a href="/me/profile">Cancel</a>
        </Button>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isPending}>
              {(isSubmitting || isPending) && (
                <Spinner data-icon="inline-start" />
              )}
              {isSubmitting || isPending ? "Saving..." : "Save Changes"}
            </Button>
          )}
        />
      </div>
    </form>
  );
}
