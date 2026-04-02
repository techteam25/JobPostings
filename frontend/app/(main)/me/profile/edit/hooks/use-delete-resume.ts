import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { instance } from "@/lib/axios-instance";
import { revalidateUserProfile } from "@/lib/api/users";

export const useDeleteResume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await instance.delete("/users/me/resume", {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
      await revalidateUserProfile();
      toast.success("Resume deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete resume");
    },
  });
};
