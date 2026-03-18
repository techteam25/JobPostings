"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { step4QuestionsSchema } from "@/schemas/applications";

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
      const result = step4QuestionsSchema.safeParse(value);

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
    <div className="animate-in fade-in slide-in-from-right-8 flex flex-col gap-6 duration-500">
      <h2 className="text-xl font-bold text-foreground">
        A few more questions
      </h2>

      <div className="flex flex-col gap-5">
        {/* Salvation Statement */}
        <form.Field
          name="salvationStatement"
          children={(field) => (
            <Field>
              <FieldLabel>
                Briefly share your salvation experience with Jesus.
              </FieldLabel>
              <Textarea
                className="min-h-24 resize-y"
                placeholder="Share your experience..."
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </Field>
          )}
        />

        {/* Race */}
        <form.Field
          name="race"
          children={(field) => (
            <Field>
              <FieldLabel>Race</FieldLabel>
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
            </Field>
          )}
        />

        {/* Gender */}
        <form.Field
          name="gender"
          children={(field) => (
            <Field>
              <FieldLabel>Gender</FieldLabel>
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
            </Field>
          )}
        />

        {/* Veteran Status */}
        <form.Field
          name="veteranStatus"
          children={(field) => (
            <Field>
              <FieldLabel>Veteran Status</FieldLabel>
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
            </Field>
          )}
        />

        {/* Years of Experience */}
        <form.Field
          name="yearsOfExperience"
          children={(field) => (
            <Field>
              <FieldLabel>Years of Relevant Work Experience</FieldLabel>
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
            </Field>
          )}
        />

        {/* Work Authorization */}
        <form.Field
          name="authorized"
          children={(field) => (
            <Field>
              <FieldLabel>
                Are you authorized to work in the United States?
              </FieldLabel>
              <RadioGroup
                value={field.state.value}
                onValueChange={(val) =>
                  field.handleChange(val as "yes" | "no")
                }
                className="flex gap-4"
              >
                <FieldLabel className="flex w-full cursor-pointer items-center gap-2 rounded-lg border p-3 font-normal hover:bg-accent">
                  <RadioGroupItem value="yes" />
                  <span className="text-sm">Yes, I am authorized</span>
                </FieldLabel>
                <FieldLabel className="flex w-full cursor-pointer items-center gap-2 rounded-lg border p-3 font-normal hover:bg-accent">
                  <RadioGroupItem value="no" />
                  <span className="text-sm">No, I require sponsorship</span>
                </FieldLabel>
              </RadioGroup>
              <FieldInfo field={field} />
            </Field>
          )}
        />
      </div>

      <div className="flex justify-between gap-3 pt-6">
        <Button variant="outline" onClick={() => setStep(3)}>
          Back
        </Button>
        <Button
          onClick={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          Submit Application
        </Button>
      </div>
    </div>
  );
};
