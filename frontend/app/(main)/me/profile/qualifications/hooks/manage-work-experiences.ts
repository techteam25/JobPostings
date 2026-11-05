import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { instance } from "@/lib/axios-instance";
import { revalidateUserProfile } from "@/lib/api/users";
import type { WorkExperienceFormData } from "@/schemas/work-experiences";

export const useBatchCreateWorkExperiences = () => {
  return useMutation({
    mutationFn: async (data: WorkExperienceFormData[]) => {
      const response = await instance.post(
        "/users/me/work-experiences/batch",
        { workExperiences: data },
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      revalidateUserProfile();
      toast.success("Work experience entries added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add work experience entries");
    },
  });
};

export const useUpdateWorkExperience = () => {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<WorkExperienceFormData>;
    }) => {
      const response = await instance.put(
        `/users/me/work-experiences/${id}`,
        data,
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      revalidateUserProfile();
      toast.success("Work experience updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update work experience");
    },
  });
};

export const useDeleteWorkExperience = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await instance.delete(
        `/users/me/work-experiences/${id}`,
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      revalidateUserProfile();
      toast.success("Work experience deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete work experience");
    },
  });
};
