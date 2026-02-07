import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { instance } from "@/lib/axios-instance";
import { EmailPreferences, ApiResponse } from "@/lib/types";

// Query hook with initial data from server
export const useEmailPreferences = (initialData: EmailPreferences) => {
  return useQuery({
    queryKey: ["emailPreferences"],
    queryFn: async (): Promise<EmailPreferences> => {
      const response = await instance.get<ApiResponse<EmailPreferences>>(
        "/users/me/email-preferences",
        { withCredentials: true },
      );
      if (!response.data.success || !response.data.data) {
        throw new Error("Failed to fetch email preferences");
      }
      return response.data.data;
    },
    initialData,
    staleTime: 30_000,
  });
};

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
    onMutate: async ({ preferenceType, enabled }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["emailPreferences"] });

      // Snapshot the previous value
      const previousPreferences = queryClient.getQueryData<EmailPreferences>([
        "emailPreferences",
      ]);

      // Optimistically update to the new value
      if (previousPreferences) {
        queryClient.setQueryData<EmailPreferences>(["emailPreferences"], {
          ...previousPreferences,
          [preferenceType]: enabled,
        });
      }

      // Return a context object with the snapshotted value
      return { previousPreferences };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          ["emailPreferences"],
          context.previousPreferences,
        );
      }
      toast.error("Failed to update preference");
    },
    onSuccess: () => {
      toast.success("Preference updated");
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
    onMutate: async (context) => {
      await queryClient.cancelQueries({ queryKey: ["emailPreferences"] });

      const previousPreferences = queryClient.getQueryData<EmailPreferences>([
        "emailPreferences",
      ]);

      if (previousPreferences) {
        const updates: Partial<EmailPreferences> = {};
        if (context === "global") {
          updates.globalUnsubscribe = true;
        } else if (context === "job_seeker") {
          updates.jobSeekerUnsubscribed = true;
        } else if (context === "employer") {
          updates.employerUnsubscribed = true;
        }

        queryClient.setQueryData<EmailPreferences>(["emailPreferences"], {
          ...previousPreferences,
          ...updates,
        });
      }

      return { previousPreferences };
    },
    onError: (_err, _context, rollbackContext) => {
      if (rollbackContext?.previousPreferences) {
        queryClient.setQueryData(
          ["emailPreferences"],
          rollbackContext.previousPreferences,
        );
      }
      toast.error("Failed to unsubscribe");
    },
    onSuccess: (_, context) => {
      toast.success(`Unsubscribed from ${context.replace("_", " ")} emails`);
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
    onMutate: async (context) => {
      await queryClient.cancelQueries({ queryKey: ["emailPreferences"] });

      const previousPreferences = queryClient.getQueryData<EmailPreferences>([
        "emailPreferences",
      ]);

      if (previousPreferences) {
        const updates: Partial<EmailPreferences> = {};
        if (context === "global") {
          updates.globalUnsubscribe = false;
        } else if (context === "job_seeker") {
          updates.jobSeekerUnsubscribed = false;
        } else if (context === "employer") {
          updates.employerUnsubscribed = false;
        }

        queryClient.setQueryData<EmailPreferences>(["emailPreferences"], {
          ...previousPreferences,
          ...updates,
        });
      }

      return { previousPreferences };
    },
    onError: (_err, _context, rollbackContext) => {
      if (rollbackContext?.previousPreferences) {
        queryClient.setQueryData(
          ["emailPreferences"],
          rollbackContext.previousPreferences,
        );
      }
      toast.error("Failed to re-subscribe");
    },
    onSuccess: (_, context) => {
      toast.success(`Re-subscribed to ${context.replace("_", " ")} emails`);
    },
  });
};
