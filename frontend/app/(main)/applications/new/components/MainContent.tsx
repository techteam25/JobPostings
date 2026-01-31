"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Step1Upload } from "@/app/(main)/applications/new/components/Step1Upload";
import { Step2Details } from "@/app/(main)/applications/new/components/Step2Details";
import { Step3Questions } from "@/app/(main)/applications/new/components/Step3Questions";
import { Step4Success } from "@/app/(main)/applications/new/components/Step4Success";
import { applyForJob } from "@/lib/api";
import { UserWithProfile } from "@/lib/types";
import { useApplicationStore } from "@/context/store";

interface MainContentProps {
  jobId: number;
  userProfile: UserWithProfile;
}

export const MainContent = ({ jobId, userProfile }: MainContentProps) => {
  const { step, formData, initializeForm, resetForm } = useApplicationStore();

  // Initialize form with user data on mount and cleanup on unmount
  useEffect(() => {
    initializeForm({
      firstName: userProfile.fullName.split(" ")[0],
      lastName: userProfile.fullName.split(" ")[1],
      email: userProfile.email,
    });

    // Cleanup: reset the store when component unmounts
    return () => {
      resetForm();
    };
  }, [userProfile, initializeForm, resetForm]);

  const handleSubmitApplication = async () => {
    const formDataToSend = new FormData();

    if (formData.resume) {
      formDataToSend.append("resume", formData.resume);
    }
    formDataToSend.append("coverLetter", formData.coverLetter || "");

    if (formData.customAnswers) {
      const answers = {
        authorized: formData.customAnswers.authorized,
      };
      formDataToSend.append("customAnswers", JSON.stringify(answers));
    }

    formDataToSend.append("firstName", formData.firstName);
    formDataToSend.append("lastName", formData.lastName);
    formDataToSend.append("email", formData.email);
    if (formData.phone) formDataToSend.append("phone", formData.phone);
    if (formData.linkedIn) formDataToSend.append("linkedIn", formData.linkedIn);
    if (formData.website) formDataToSend.append("website", formData.website);

    const res = await applyForJob(jobId, formDataToSend);
    if (!res.success) {
      toast.error(res.message);
    }
    // Success is handled in Step3Questions
  };

  return (
    <div className="flex-1 p-8 md:p-12">
      {step === 1 && <Step1Upload />}
      {step === 2 && <Step2Details />}
      {step === 3 && <Step3Questions onSubmit={handleSubmitApplication} />}
      {step === 4 && <Step4Success />}
    </div>
  );
};
