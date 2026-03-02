"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Step1Upload } from "@/app/(main)/applications/new/components/Step1Upload";
import { Step2CoverLetter } from "@/app/(main)/applications/new/components/Step2CoverLetter";
import { Step3UserInfo } from "@/app/(main)/applications/new/components/Step3UserInfo";
import { Step4Questions } from "@/app/(main)/applications/new/components/Step4Questions";
import { Step5Success } from "@/app/(main)/applications/new/components/Step5Success";
import { applyForJob } from "@/lib/api";
import { UserWithProfile } from "@/lib/types";
import { useApplicationStore } from "@/context/store";
import { ApplicationFormData } from "@/context/slices/application-form-slice";

interface MainContentProps {
  jobId: number;
  userProfile: UserWithProfile;
}

export const MainContent = ({ jobId, userProfile }: MainContentProps) => {
  const { step, initializeForm, resetForm } = useApplicationStore();

  // Initialize form with user profile location data on mount
  useEffect(() => {
    initializeForm({
      country: userProfile.profile?.country,
      city: userProfile.profile?.city,
      state: userProfile.profile?.state,
      zipcode: userProfile.profile?.zipCode,
    });

    return () => {
      resetForm();
    };
  }, [userProfile, initializeForm, resetForm]);

  // Accept finalData directly to avoid race condition with async store updates
  const handleSubmitApplication = async (
    finalData: ApplicationFormData,
  ): Promise<boolean> => {
    const formDataToSend = new FormData();

    if (finalData.resume) {
      formDataToSend.append("resume", finalData.resume);
    }

    if (finalData.coverLetter) {
      formDataToSend.append("coverLetter", finalData.coverLetter);
    }

    // Serialize all answers + location into customAnswers JSON
    const customAnswers = {
      ...finalData.customAnswers,
      country: finalData.country,
      city: finalData.city,
      state: finalData.state,
      zipcode: finalData.zipcode,
    };
    formDataToSend.append("customAnswers", JSON.stringify(customAnswers));

    const res = await applyForJob(jobId, formDataToSend);
    if (!res.success) {
      toast.error(res.message);
      return false;
    }
    return true;
  };

  return (
    <div className="flex-1 p-8 md:p-12">
      {step === 1 && <Step1Upload />}
      {step === 2 && <Step2CoverLetter />}
      {step === 3 && <Step3UserInfo />}
      {step === 4 && <Step4Questions onSubmit={handleSubmitApplication} />}
      {step === 5 && (
        <Step5Success
          userName={userProfile.fullName}
          email={userProfile.email}
        />
      )}
    </div>
  );
};
