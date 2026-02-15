"use client";

import { ChevronLeft } from "lucide-react";
import { useApplicationForm } from "../hooks/use-application-form";

export const ApplicationHeader = () => {
  const { step } = useApplicationForm();

  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="flex cursor-pointer items-center gap-2 text-slate-500 transition-colors hover:text-slate-800">
        <ChevronLeft size={20} />
        <span className="font-medium">Back to Jobs</span>
      </div>

      {step < 5 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">
            Step {step} of 4
          </span>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-slate-900 transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
