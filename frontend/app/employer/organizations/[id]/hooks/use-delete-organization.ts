import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { instance } from "@/lib/axios-instance";

export const useDeleteOrganization = (organizationId: number) => {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const response = await instance.delete(
        `/organizations/${organizationId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Organization deleted successfully");
      router.push("/employer/organizations");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete organization");
    },
  });
};
