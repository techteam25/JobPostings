"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "@/components/common/FieldInfo";
import { useForm } from "@tanstack/react-form";
import { useApplicationStore } from "@/context/store";
import { toast } from "sonner";
import { z } from "zod";

const step3Schema = z.object({
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional().or(z.literal("")),
  zipcode: z.string().optional().or(z.literal("")),
});

export const Step3UserInfo = () => {
  const { setStep, formData, setFormData } = useApplicationStore();

  const form = useForm({
    defaultValues: {
      country: formData.country,
      city: formData.city,
      state: formData.state,
      zipcode: formData.zipcode,
    },
    onSubmit: async ({ value }) => {
      setFormData(value);
      setStep(4);
    },
  });

  const handleContinue = async () => {
    const values = form.state.values;
    const result = step3Schema.safeParse(values);

    if (!result.success) {
      const firstError = result.error.issues[0];
      toast.error(firstError.message);
      return;
    }

    await form.handleSubmit();
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 space-y-6 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">
          Your Location Info
        </h2>
        <p className="text-sm text-slate-500">
          Please confirm or update your location details.
        </p>
      </div>

      <form.Field
        name="country"
        children={(field) => (
          <div>
            <Label htmlFor="id-country">Country</Label>
            <Input
              id="id-country"
              placeholder="e.g. United States"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </div>
        )}
      />

      <form.Field
        name="city"
        children={(field) => (
          <div>
            <Label htmlFor="id-city">City</Label>
            <Input
              id="id-city"
              placeholder="e.g. Dallas"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="state"
          children={(field) => (
            <div>
              <Label htmlFor="id-state">State</Label>
              <Input
                id="id-state"
                placeholder="e.g. TX"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        />
        <form.Field
          name="zipcode"
          children={(field) => (
            <div>
              <Label htmlFor="id-zipcode">Zip Code</Label>
              <Input
                id="id-zipcode"
                placeholder="e.g. 75001"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep(2)}>
          Back
        </Button>
        <Button onClick={handleContinue}>Continue</Button>
      </div>
    </div>
  );
};
