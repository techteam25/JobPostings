import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { instance } from "@/lib/axios-instance";
import type { ApplicationNote } from "@/lib/types";

export function applicationNotesQueryKey(
  organizationId: number,
  jobId: number,
  applicationId: number,
) {
  return ["application-notes", organizationId, jobId, applicationId] as const;
}

export function useApplicationNotes({
  organizationId,
  jobId,
  applicationId,
  enabled,
}: {
  organizationId: number;
  jobId: number;
  applicationId: number;
  enabled: boolean;
}) {
  const queryClient = useQueryClient();
  const queryKey = applicationNotesQueryKey(
    organizationId,
    jobId,
    applicationId,
  );

  const notesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await instance.get<{ data: ApplicationNote[] }>(
        `/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/notes`,
      );
      return response.data.data;
    },
    enabled,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const response = await instance.post<{ data: unknown }>(
        `/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/notes`,
        { note },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Note added");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add note");
    },
  });

  return { notesQuery, addNoteMutation };
}
