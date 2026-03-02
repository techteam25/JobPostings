"use client";

import { Button } from "@/components/ui/button";
import { useApplicationForm } from "../hooks/use-application-form";

export const ApplicationFooter = () => {
  const { step, setStep, formData } = useApplicationForm();

  if (step >= 5) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-6">
      <Button
        variant="ghost"
        onClick={() => setStep((s) => Math.max(1, s - 1))}
        disabled={step === 1}
      >
        Back
      </Button>

      <Button
        variant={step === 4 ? "default" : "secondary"}
        onClick={() => setStep((s) => s + 1)}
        disabled={step === 1 && !formData.resume}
        className="w-32"
      >
        {step === 4 ? "Submit" : "Continue"}
      </Button>
    </div>
  );
};
