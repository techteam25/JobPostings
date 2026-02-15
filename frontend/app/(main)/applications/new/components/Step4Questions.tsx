"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FieldInfo } from "@/components/common/FieldInfo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "@tanstack/react-form";
import { useApplicationStore } from "@/context/store";
import { ApplicationFormData } from "@/context/slices/application-form-slice";
import { toast } from "sonner";
import { z } from "zod";

const step4Schema = z.object({
  salvationStatement: z
    .string()
    .min(10, "Please share your salvation experience"),
  race: z.string().min(1, "Please select a race"),
  gender: z.enum(["Male", "Female"], { message: "Please select a gender" }),
  veteranStatus: z.string().min(1, "Please select veteran status"),
  yearsOfExperience: z.enum(["0-1", "2-4", "5-9", "10+"], {
    message: "Please select years of experience",
  }),
  authorized: z.enum(["yes", "no"], { message: "Please select an option" }),
});

const RACE_OPTIONS = [
  "Asian",
  "Black",
  "Hispanic",
  "White",
  "Other",
  "Prefer not to disclose",
];

const GENDER_OPTIONS = ["Male", "Female"] as const;

const VETERAN_OPTIONS = [
  "I am a veteran",
  "I am not a veteran",
  "Prefer not to disclose",
];

const EXPERIENCE_OPTIONS = ["0-1", "2-4", "5-9", "10+"] as const;

interface Step4QuestionsProps {
  onSubmit: (finalData: ApplicationFormData) => Promise<boolean>;
}

export const Step4Questions = ({ onSubmit }: Step4QuestionsProps) => {
  const { setStep, formData, setFormData } = useApplicationStore();

  const form = useForm({
    defaultValues: {
      salvationStatement: formData.customAnswers?.salvationStatement || "",
      race: formData.customAnswers?.race || "",
      gender: formData.customAnswers?.gender || (undefined as any),
      veteranStatus: formData.customAnswers?.veteranStatus || "",
      yearsOfExperience:
        formData.customAnswers?.yearsOfExperience || (undefined as any),
      authorized: formData.customAnswers?.authorized || (undefined as any),
    },
    onSubmit: async ({ value }) => {
      const result = step4Schema.safeParse(value);

      if (!result.success) {
        const firstError = result.error.issues[0];
        toast.error(firstError.message);
        return;
      }

      // Build complete form data snapshot (avoids race condition)
      const currentFormData = useApplicationStore.getState().formData;
      const finalData: ApplicationFormData = {
        ...currentFormData,
        customAnswers: {
          salvationStatement: value.salvationStatement,
          race: value.race,
          gender: value.gender,
          veteranStatus: value.veteranStatus,
          yearsOfExperience: value.yearsOfExperience,
          authorized: value.authorized,
        },
      };

      // Update store for UI consistency
      setFormData({ customAnswers: finalData.customAnswers });

      const success = await onSubmit(finalData);
      if (success) {
        toast.success("Application submitted successfully!");
        setStep(5);
      }
    },
  });

  return (
    <div className="animate-in fade-in slide-in-from-right-8 space-y-6 duration-500">
      <h2 className="text-xl font-bold text-slate-900">
        A few more questions
      </h2>

      <div className="space-y-5">
        {/* Salvation Statement */}
        <form.Field
          name="salvationStatement"
          children={(field) => (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Briefly share your salvation experience with Jesus.
              </Label>
              <Textarea
                className="min-h-24 resize-y"
                placeholder="Share your experience..."
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </div>
          )}
        />

        {/* Race */}
        <form.Field
          name="race"
          children={(field) => (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Race</Label>
              <Select
                value={field.state.value}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select race" />
                </SelectTrigger>
                <SelectContent>
                  {RACE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldInfo field={field} />
            </div>
          )}
        />

        {/* Gender */}
        <form.Field
          name="gender"
          children={(field) => (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Gender
              </Label>
              <Select
                value={field.state.value}
                onValueChange={(val) =>
                  field.handleChange(val as "Male" | "Female")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldInfo field={field} />
            </div>
          )}
        />

        {/* Veteran Status */}
        <form.Field
          name="veteranStatus"
          children={(field) => (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Veteran Status
              </Label>
              <Select
                value={field.state.value}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select veteran status" />
                </SelectTrigger>
                <SelectContent>
                  {VETERAN_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldInfo field={field} />
            </div>
          )}
        />

        {/* Years of Experience */}
        <form.Field
          name="yearsOfExperience"
          children={(field) => (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Years of Relevant Work Experience
              </Label>
              <Select
                value={field.state.value}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience range" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option} years
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldInfo field={field} />
            </div>
          )}
        />

        {/* Work Authorization */}
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

      <div className="flex justify-between gap-3 pt-6">
        <Button variant="outline" onClick={() => setStep(3)}>
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
