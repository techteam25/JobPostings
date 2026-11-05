"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { countries } from "countries-list";
import states from "states-us";
import { MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { updateProfile, completeOnboarding } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
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

export function WelcomeForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const form = useForm({
    defaultValues: {
      country: "",
      state: "",
      city: "",
      isAvailableForWork: true,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);

      try {
        const profileData: Record<string, unknown> = {
          isAvailableForWork: value.isAvailableForWork,
        };
        if (value.country) profileData.country = value.country;
        if (value.state && value.country === "United States") {
          profileData.state = value.state;
        }
        if (value.city) profileData.city = value.city;

        const profileResult = await updateProfile(profileData);
        if (!profileResult.success) {
          toast.error("Failed to save profile. Please try again.");
          setIsSubmitting(false);
          return;
        }

        const onboardingResult = await completeOnboarding();
        if (!onboardingResult.success) {
          toast.error("Something went wrong. Please try again.");
          setIsSubmitting(false);
          return;
        }

        router.replace("/");
      } catch {
        toast.error("An unexpected error occurred. Please try again.");
        setIsSubmitting(false);
      }
    },
  });

  const handleSkip = async () => {
    setIsSkipping(true);

    try {
      const result = await completeOnboarding();
      if (!result.success) {
        toast.error("Something went wrong. Please try again.");
        setIsSkipping(false);
        return;
      }

      router.replace("/");
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
      setIsSkipping(false);
    }
  };

  const isLoading = isSubmitting || isSkipping;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="bg-accent/10 mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
            <Sparkles className="text-accent size-7" />
          </div>
          <h1 className="text-foreground mb-2 text-2xl font-bold tracking-tight">
            Welcome to GetInvolved
          </h1>
          <p className="text-muted-foreground text-sm">
            Help us personalize your experience. All fields are optional — you
            can always update these later.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col gap-6"
        >
          <div className="bg-card rounded-xl border p-6">
            <div className="mb-5 flex items-center gap-2">
              <MapPin className="text-muted-foreground size-4" />
              <span className="text-foreground text-sm font-medium">
                Location
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <FieldGroup>
                <form.Field
                  name="country"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor="welcome-country">Country</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value}
                        onValueChange={(value) => {
                          field.handleChange(value);
                          if (value !== "United States") {
                            form.setFieldValue("state", "");
                          }
                        }}
                      >
                        <SelectTrigger
                          id="welcome-country"
                          className="h-11 rounded-lg"
                        >
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          <SelectGroup>
                            <SelectLabel>Countries</SelectLabel>
                            <SelectSeparator className="bg-input" />
                            {Object.entries(countries).map(
                              ([code, country]) => (
                                <SelectItem key={code} value={country.name}>
                                  {country.name}
                                </SelectItem>
                              ),
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </FieldGroup>

              <form.Subscribe
                selector={(s) => s.values.country}
                children={(country) => {
                  const isUS = country === "United States";

                  return (
                    <FieldGroup>
                      <form.Field
                        name="state"
                        children={(field) => (
                          <Field data-disabled={!isUS || undefined}>
                            <FieldLabel htmlFor="welcome-state">
                              State
                            </FieldLabel>
                            <Select
                              name={field.name}
                              value={field.state.value}
                              onValueChange={field.handleChange}
                              disabled={!isUS}
                            >
                              <SelectTrigger
                                id="welcome-state"
                                className="h-11 rounded-lg"
                              >
                                <SelectValue
                                  placeholder={
                                    isUS ? "Select your state" : "US only"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent position="item-aligned">
                                <SelectGroup>
                                  <SelectLabel>States</SelectLabel>
                                  <SelectSeparator className="bg-input" />
                                  {states.map((state) => (
                                    <SelectItem
                                      key={state.name}
                                      value={state.name}
                                    >
                                      {state.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </Field>
                        )}
                      />
                    </FieldGroup>
                  );
                }}
              />

              <FieldGroup>
                <form.Field
                  name="city"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor="welcome-city">City</FieldLabel>
                      <Input
                        id="welcome-city"
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter your city"
                        className="h-11 rounded-lg"
                        autoComplete="off"
                      />
                    </Field>
                  )}
                />
              </FieldGroup>
            </div>
          </div>

          <div className="bg-card rounded-xl border p-6">
            <FieldGroup>
              <form.Field
                name="isAvailableForWork"
                children={(field) => (
                  <Field orientation="horizontal">
                    <div className="flex-1">
                      <FieldLabel htmlFor="welcome-availability">
                        Are you actively looking?
                      </FieldLabel>
                      <FieldDescription>
                        Let organizations know you&apos;re open to opportunities
                      </FieldDescription>
                    </div>
                    <Switch
                      id="welcome-availability"
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-accent hover:bg-accent/90 text-accent-foreground h-11 w-full cursor-pointer rounded-lg font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Getting started...
                </>
              ) : (
                "Get started"
              )}
            </Button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSkipping ? "Skipping..." : "Skip for now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
