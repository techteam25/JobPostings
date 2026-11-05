import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { instance } from "@/lib/axios-instance";
import type { ApplicationStatus } from "@/lib/application-status";
import type { ApiResponse, OrganizationJobApplications } from "@/lib/types";

interface UpdateApplicationStatusInput {
  jobId: number;
  applicationId: number;
  status: ApplicationStatus;
}

export function useUpdateApplicationStatus(organizationId: number) {
  return useMutation({
    mutationFn: async ({
      jobId,
      applicationId,
      status,
    }: UpdateApplicationStatusInput) => {
      const response = await instance.patch<
        ApiResponse<OrganizationJobApplications>
      >(
        `/organizations/${organizationId}/jobs/${jobId}/applications/${applicationId}/status`,
        { status },
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to update application status",
        );
      }

      return response.data.data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update application status");
    },
  });
}
