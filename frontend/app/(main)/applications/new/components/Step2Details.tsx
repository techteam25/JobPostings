"use client";

import { CheckCircle2, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "@/components/common/FieldInfo";
import { useForm } from "@tanstack/react-form";
import { useApplicationStore } from "@/context/store";
import { toast } from "sonner";
import { z } from "zod";

const step2Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  linkedIn: z.url("Invalid URL").optional().or(z.literal("")),
  website: z.url("Invalid URL").optional().or(z.literal("")),
});

export const Step2Details = () => {
  const { setStep, formData, setFormData } = useApplicationStore();

  const form = useForm({
    defaultValues: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      linkedIn: formData.linkedIn || "",
      website: formData.website || "",
    },
    onSubmit: async ({ value }) => {
      setFormData(value);
      setStep(3);
    },
  });

  const handleContinue = async () => {
    const values = form.state.values;

    // Validate using the schema
    const result = step2Schema.safeParse(values);

    if (!result.success) {
      const firstError = result.error.issues[0];
      toast.error(firstError.message);
      return;
    }

    await form.handleSubmit();
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 space-y-6 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Contact Info</h2>
        <button
          onClick={() => setStep(1)}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Replace Resume
        </button>
      </div>

      {/* Resume File Badge */}
      {formData.resume && (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {formData.resume.name}
              </p>
              <p className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 size={12} /> Ready to submit
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFormData({ resume: null })}
          >
            <X size={16} />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="firstName"
          children={(field) => (
            <div>
              <Label htmlFor="id-first-name">First Name</Label>
              <Input
                id="id-first-name"
                placeholder="Enter your firstname"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        />
        <form.Field
          name="lastName"
          children={(field) => (
            <div>
              <Label htmlFor="id-last-name">Last Name</Label>
              <Input
                id="id-last-name"
                placeholder="Enter your lastname"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        />
      </div>

      <form.Field
        name="email"
        children={(field) => (
          <div>
            <Label htmlFor="id-email">Email</Label>
            <Input
              id="id-email"
              placeholder="you@example.com"
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </div>
        )}
      />

      <form.Field
        name="phone"
        children={(field) => (
          <div>
            <Label htmlFor="id-phone">Phone</Label>
            <Input
              id="id-phone"
              placeholder="(123) 456-7890"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </div>
        )}
      />

      <div className="border-t border-slate-100 pt-4">
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Online Presence
        </h2>
        <div className="grid gap-4">
          <form.Field
            name="linkedIn"
            children={(field) => (
              <div>
                <Label htmlFor="id-linkedin">LinkedIn Profile</Label>
                <Input
                  id="id-linkedin"
                  placeholder="https://linkedin.com/in/..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />
          <form.Field
            name="website"
            children={(field) => (
              <div>
                <Label htmlFor="id-website">Portfolio / Website</Label>
                <Input
                  id="id-website"
                  placeholder="https://..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleContinue} className="w-full md:w-auto">
          Continue
        </Button>
      </div>
    </div>
  );
};
