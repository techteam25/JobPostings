import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";

import { createJobSchema } from "@/schemas/jobs";
import { useCreateJob } from "@/app/employer/organizations/hooks/use-manage-jobs";

export function useCreateJobForm(organizationId: number) {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateJob(organizationId);

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      city: "",
      state: "",
      country: "United States",
      zipcode: null as number | null,
      jobType: "full-time" as
        | "full-time"
        | "part-time"
        | "contract"
        | "volunteer"
        | "internship",
      compensationType: "paid" as
        | "paid"
        | "missionary"
        | "volunteer"
        | "stipend",
      isRemote: false,
      applicationDeadline: null as string | null,
      experience: "",
    },
    validators: {
      onChange: createJobSchema,
    },
    onSubmit: async (values) => {
      await mutateAsync(values.value);
      router.push(`/employer/organizations/${organizationId}/jobs`);
    },
  });

  return { form, isPending, organizationId };
}

export type CreateJobFormApi = ReturnType<typeof useCreateJobForm>["form"];
