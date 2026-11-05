import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { instance } from "@/lib/axios-instance";
import type { EditOrganizationData } from "@/schemas/organizations/edit-organization";

export const useUpdateOrganization = (organizationId: number) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: EditOrganizationData) => {
      const response = await instance.put(
        `/organizations/${organizationId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fetch-organization", String(organizationId)],
      });
      toast.success("Organization updated successfully");
      router.push(`/employer/organizations/${organizationId}/settings`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update organization");
    },
  });
};
