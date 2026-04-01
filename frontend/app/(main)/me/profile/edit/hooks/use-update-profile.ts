import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { instance } from "@/lib/axios-instance";
import { revalidateUserProfile } from "@/lib/api/users";
import type { UpdateProfileData } from "@/lib/types";

export const useUpdateProfile = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await instance.put("/users/me/profile", data, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      revalidateUserProfile();
      toast.success("Profile updated successfully");
      router.replace("/me/profile");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
};
