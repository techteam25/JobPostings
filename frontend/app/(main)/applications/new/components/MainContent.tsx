"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { applyForJob } from "@/lib/api";
import { UserWithProfile } from "@/lib/types";
import { useApplicationStore } from "@/context/store";
import { ApplicationFormData } from "@/context/slices/application-form-slice";

const StepSkeleton = () => (
  <div className="flex flex-col gap-6">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-full max-w-md" />
    <Skeleton className="h-48 w-full rounded-md" />
    <div className="flex justify-end gap-3">
      <Skeleton className="h-10 w-24 rounded-md" />
      <Skeleton className="h-10 w-24 rounded-md" />
    </div>
  </div>
);

const Step1Upload = dynamic(
  () =>
    import("@/app/(main)/applications/new/components/Step1Upload").then(
      (mod) => ({ default: mod.Step1Upload }),
    ),
  { loading: () => <StepSkeleton /> },
);

const Step2CoverLetter = dynamic(
  () =>
    import("@/app/(main)/applications/new/components/Step2CoverLetter").then(
      (mod) => ({ default: mod.Step2CoverLetter }),
    ),
  { loading: () => <StepSkeleton /> },
);

const Step3UserInfo = dynamic(
  () =>
    import("@/app/(main)/applications/new/components/Step3UserInfo").then(
      (mod) => ({ default: mod.Step3UserInfo }),
    ),
  { loading: () => <StepSkeleton /> },
);

const Step4Questions = dynamic(
  () =>
    import("@/app/(main)/applications/new/components/Step4Questions").then(
      (mod) => ({ default: mod.Step4Questions }),
    ),
  { loading: () => <StepSkeleton /> },
);

const Step5Success = dynamic(
  () =>
    import("@/app/(main)/applications/new/components/Step5Success").then(
      (mod) => ({ default: mod.Step5Success }),
    ),
  { loading: () => <StepSkeleton /> },
);

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
