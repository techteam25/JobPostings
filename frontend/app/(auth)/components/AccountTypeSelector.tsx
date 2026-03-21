"use client";

import { Briefcase, User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { RegistrationFormApi } from "../hooks/use-registration-form";

interface AccountTypeSelectorProps {
  form: RegistrationFormApi;
  onIntentChange: (intent: "seeker" | "employer") => void;
}

export function AccountTypeSelector({
  form,
  onIntentChange,
}: AccountTypeSelectorProps) {
  return (
    <div>
      <Label className="text-secondary-foreground mb-3 block text-xs font-semibold sm:text-sm">
        I am a...
      </Label>
      <div className="grid grid-cols-2 gap-3">
        <form.Field
          name="accountType"
          children={(field) => (
            <button
              type="button"
              onClick={() => {
                field.setValue("seeker");
                onIntentChange("seeker");
              }}
              className={cn(
                "cursor-pointer rounded-2xl border-2 p-2 transition sm:p-4",
                {
                  "border-chart-4 bg-background":
                    field.state.value === "seeker",
                  "border-secondary hover:border-border":
                    field.state.value !== "seeker",
                },
              )}
            >
              <div className="mb-2 flex justify-center">
                <User className="size-6 text-chart-1 sm:size-10" />
              </div>
              <div className="text-foreground font-semibold">Job Seeker</div>
              <div className="text-muted-foreground hidden text-xs sm:block">
                Looking for opportunities
              </div>
            </button>
          )}
        />

        <form.Field
          name="accountType"
          children={(field) => (
            <button
              type="button"
              onClick={() => {
                field.setValue("employer");
                onIntentChange("employer");
              }}
              className={cn(
                "cursor-pointer rounded-2xl border-2 p-2 transition sm:p-4",
                {
                  "border-chart-4 bg-background":
                    field.state.value === "employer",
                  "border-secondary hover:border-border":
                    field.state.value !== "employer",
                },
              )}
            >
              <div className="mb-2 flex justify-center">
                <Briefcase className="size-6 text-chart-2 sm:size-10" />
              </div>
              <div className="text-foreground font-semibold">Employer</div>
              <div className="text-muted-foreground hidden text-xs sm:block">
                Hiring talent
              </div>
            </button>
          )}
        />
        <form.Field
          name="accountType"
          children={(field) => (
            <input
              name={field.name}
              value={field.state.value}
              onChange={(e) =>
                field.handleChange(
                  e.target.value as "seeker" | "employer",
                )
              }
              type="hidden"
            />
          )}
        />
      </div>
    </div>
  );
}
