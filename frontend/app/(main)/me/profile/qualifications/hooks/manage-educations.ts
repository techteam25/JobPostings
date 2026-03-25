import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { instance } from "@/lib/axios-instance";
import { revalidateUserProfile } from "@/lib/api/users";
import type { EducationFormData } from "@/schemas/educations";

export const useBatchCreateEducations = () => {
  return useMutation({
    mutationFn: async (data: EducationFormData[]) => {
      const response = await instance.post(
        "/users/me/educations/batch",
        { educations: data },
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      revalidateUserProfile();
      toast.success("Education entries added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add education entries");
    },
  });
};

export const useUpdateEducation = () => {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<EducationFormData>;
    }) => {
      const response = await instance.put(`/users/me/educations/${id}`, data, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      revalidateUserProfile();
      toast.success("Education updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update education");
    },
  });
};

export const useDeleteEducation = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await instance.delete(`/users/me/educations/${id}`, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      revalidateUserProfile();
      toast.success("Education deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete education");
    },
  });
};
