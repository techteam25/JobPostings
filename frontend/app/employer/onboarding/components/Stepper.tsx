import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  title: string;
  description?: string;
  key: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: string;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="relative mx-auto flex max-w-md flex-col space-y-6">
      {steps.map((step, index) => {
        const isActive = currentStep === step.key;
        const isCompleted =
          steps.findIndex((s) => s.key === currentStep) > index;
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className="flex items-start space-x-4">
            {/* Step indicator */}
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                      ? "border-primary text-primary"
                      : "text-muted-foreground border-border",
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute top-8 left-1/2 h-full w-[2px] -translate-x-1/2",
                    isCompleted ? "bg-primary" : "bg-muted",
                  )}
                />
              )}
            </div>

            {/* Step details */}
            <div className="flex flex-col">
              <h3
                className={cn(
                  "font-semibold",
                  isActive ? "text-primary" : "text-secondary-foreground",
                )}
              >
                {step.title}
              </h3>
              {step.description && (
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
