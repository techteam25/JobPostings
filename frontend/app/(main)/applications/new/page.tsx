"use client";

import { useApplicationForm } from "./hooks/use-application-form";
import {
  ApplicationFooter,
  ApplicationHeader,
  JobContextSidebar,
  Step1Upload,
  Step2Details,
  Step3Questions,
  Step4Success,
} from "./components";

export default function ApplyForJob() {
  const { step } = useApplicationForm();

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans md:p-8">
      <div className="mx-auto max-w-6xl">
        <ApplicationHeader />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <JobContextSidebar />

          {/* RIGHT COLUMN: Application Flow */}
          <div className="lg:col-span-8">
            <div className="flex min-h-[600px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
              {/* Main Content Area */}
              <div className="flex-1 p-8 md:p-12">
                {step === 1 && <Step1Upload />}
                {step === 2 && <Step2Details />}
                {step === 3 && <Step3Questions />}
                {step === 4 && <Step4Success />}
              </div>

              <ApplicationFooter />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
