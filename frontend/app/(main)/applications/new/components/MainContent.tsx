import { useApplicationForm } from "@/app/(main)/applications/new/hooks/use-application-form";
import { Step1Upload } from "@/app/(main)/applications/new/components/Step1Upload";
import { Step2Details } from "@/app/(main)/applications/new/components/Step2Details";
import { Step3Questions } from "@/app/(main)/applications/new/components/Step3Questions";
import { Step4Success } from "@/app/(main)/applications/new/components/Step4Success";

export const MainContent = () => {
  const { step } = useApplicationForm();
  return (
    <div className="flex-1 p-8 md:p-12">
      {step === 1 && <Step1Upload />}
      {step === 2 && <Step2Details />}
      {step === 3 && <Step3Questions />}
      {step === 4 && <Step4Success />}
    </div>
  );
};
