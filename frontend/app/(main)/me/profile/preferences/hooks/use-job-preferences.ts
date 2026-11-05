import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateJobPreferences } from "@/lib/api/job-preferences";
import { revalidateUserProfile } from "@/lib/api/users";

export const useUpdateJobPreferences = () => {
  return useMutation({
    mutationFn: async (data: {
      jobTypes?: string[];
      compensationTypes?: string[];
      volunteerHoursPerWeek?: string;
      workScheduleDays?: string[];
      scheduleTypes?: string[];
      workArrangements?: string[];
      commuteTime?: string;
      willingnessToRelocate?: string;
    }) => {
      const result = await updateJobPreferences(data);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      revalidateUserProfile();
      toast.success("Preferences updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update preferences");
    },
  });
};
