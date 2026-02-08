import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { instance } from "@/lib/axios-instance";

import { OrganizationWithMembersResponse } from "@/schemas/responses/organizations";

export const useCreateOrganization = () => {
  const router = useRouter();
  const {
    mutateAsync: createOrganizationAsync,
    isPending: isCreatingOrganization,
  } = useMutation({
    mutationFn: async (organizationData: FormData) => {
      const res = await instance.post<OrganizationWithMembersResponse>(
        "/organizations",
        organizationData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (!res.data.success || res.status !== 201) {
        throw new Error("Failed to create organization");
      }

      console.log({ res });

      return res.data;
    },
    onSuccess: async (organizationData: OrganizationWithMembersResponse) => {
      if (organizationData.success) {
        toast.success(
          `Organization "${organizationData.data.name}" created successfully!`,
        );
        router.replace(`/employer/organizations/${organizationData.data.id}`);
      }
    },
    onError: (e) => {
      console.log("Error creating organization:", e);
      toast.error("There was an error creating the organization.");
    },
  });

  return { createOrganizationAsync, isCreatingOrganization };
};
