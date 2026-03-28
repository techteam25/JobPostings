import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateWorkAreas } from "@/lib/api/job-preferences";
import { revalidateUserProfile } from "@/lib/api/users";

export const useUpdateWorkAreas = () => {
  return useMutation({
    mutationFn: async (data: { workAreaIds: number[] }) => {
      const result = await updateWorkAreas(data);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      revalidateUserProfile();
      toast.success("Work areas updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update work areas");
    },
  });
};
