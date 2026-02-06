import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { instance } from "@/lib/axios-instance";
import { revalidateEmailPreferences } from "@/lib/api";

export const useUpdatePreference = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      preferenceType,
      enabled,
      context,
    }: {
      preferenceType: string;
      enabled: boolean;
      context: "job_seeker" | "employer" | "global";
    }) => {
      const response = await instance.patch(
        "/users/me/email-preferences/granular",
        { preferenceType, enabled, context },
      );
      return response.data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["emailPreferences"] });
      await revalidateEmailPreferences();
      toast.success("Preference updated");
    },
    onError: () => {
      toast.error("Failed to update preference");
    },
  });
};

// Unsubscribe by context mutation
export const useUnsubscribePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (context: "job_seeker" | "employer" | "global") => {
      const response = await instance.post(
        "/users/me/email-preferences/unsubscribe-context",
        { context },
      );
      return response.data;
    },
    onSuccess: async (_, context) => {
      queryClient.invalidateQueries({ queryKey: ["emailPreferences"] });
      await revalidateEmailPreferences();
      toast.success(`Unsubscribed from ${context.replace("_", " ")} emails`);
    },
    onError: () => {
      toast.error("Failed to unsubscribe");
    },
  });
};

// Re-subscribe by context mutation
export const useResubscribePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (context: "job_seeker" | "employer" | "global") => {
      const response = await instance.post(
        "/users/me/email-preferences/resubscribe-context",
        { context },
      );
      return response.data;
    },
    onSuccess: async (_, context) => {
      queryClient.invalidateQueries({ queryKey: ["emailPreferences"] });
      await revalidateEmailPreferences();
      toast.success(`Re-subscribed to ${context.replace("_", " ")} emails`);
    },
    onError: () => {
      toast.error("Failed to re-subscribe");
    },
  });
};
