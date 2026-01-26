"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldInfo } from "@/components/common/FieldInfo";
import { useForm } from "@tanstack/react-form";
import { useApplicationStore } from "@/context/store";
import { toast } from "sonner";
import { z } from "zod";

const step3Schema = z.object({
  coverLetter: z
    .string()
    .min(50, "Cover letter must be at least 50 characters")
    .optional()
    .or(z.literal("")),
  authorized: z.enum(["yes", "no"], {
    message: "Please select an option",
  }),
});

interface Step3QuestionsProps {
  onSubmit: () => Promise<void>;
}

export const Step3Questions = ({ onSubmit }: Step3QuestionsProps) => {
  const { setStep, formData, setFormData } = useApplicationStore();

  const form = useForm({
    defaultValues: {
      coverLetter: formData.coverLetter || "",
      authorized: formData.customAnswers?.authorized || (undefined as any),
    },
    onSubmit: async ({ value }) => {
      // Validate using the schema
      const result = step3Schema.safeParse(value);

      if (!result.success) {
        const firstError = result.error.issues[0];
        toast.error(firstError.message);
        return;
      }

      setFormData({
        coverLetter: value.coverLetter,
        customAnswers: { authorized: value.authorized },
      });

      await onSubmit();
      toast.success("Application submitted successfully!");
      setStep(4);
    },
  });

  return (
    <div className="animate-in fade-in slide-in-from-right-8 space-y-6 duration-500">
      <h2 className="text-xl font-bold text-slate-900">A few last questions</h2>

      <div className="space-y-4">
        <form.Field
          name="coverLetter"
          children={(field) => (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Why do you want to join the Product Design team at TechCorp?
              </Label>
              <textarea
                className="min-h-[120px] w-full resize-y rounded-lg border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
                placeholder="Tell us about your motivation..."
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        />

        <form.Field
          name="authorized"
          children={(field) => (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Are you authorized to work in the United States?
              </Label>
              <div className="flex gap-4">
                <Label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border p-3 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="auth"
                    className="text-blue-600 focus:ring-blue-500"
                    value="yes"
                    checked={field.state.value === "yes"}
                    onChange={() => field.handleChange("yes")}
                  />
                  <span className="text-sm">Yes, I am authorized</span>
                </Label>
                <Label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border p-3 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="auth"
                    className="text-blue-600 focus:ring-blue-500"
                    value="no"
                    checked={field.state.value === "no"}
                    onChange={() => field.handleChange("no")}
                  />
                  <span className="text-sm">No, I require sponsorship</span>
                </Label>
              </div>
              <FieldInfo field={field} />
            </div>
          )}
        />
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <Button variant="outline" onClick={() => setStep(2)}>
          Back
        </Button>
        <button
          onClick={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Submit Application
        </button>
      </div>
    </div>
  );
};
