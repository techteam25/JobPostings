import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";

import { createJobSchema } from "@/schemas/jobs";
import { useUpdateJob } from "@/app/employer/organizations/hooks/use-manage-jobs";
import type { Job } from "@/schemas/responses/jobs";
import type { JobFormApi } from "../../../new/hooks/use-create-job-form";

export function mapJobToFormValues(job: Job) {
  return {
    title: job.title,
    description: job.description,
    city: job.city,
    state: job.state || "",
    country: job.country,
    zipcode:
      job.zipcode == null || String(job.zipcode).trim() === ""
        ? null
        : String(job.zipcode),
    jobType: job.jobType,
    compensationType: job.compensationType,
    isRemote: job.isRemote,
    applicationDeadline: job.applicationDeadline
      ? new Date(job.applicationDeadline).toISOString().split("T")[0]
      : null,
    experience: job.experience || "",
  };
}

function transformFormValues(values: ReturnType<typeof mapJobToFormValues>) {
  const { zipcode, applicationDeadline, ...rest } = values;
  return {
    ...rest,
    zipcode: zipcode == null ? null : String(zipcode),
    applicationDeadline: applicationDeadline
      ? new Date(`${applicationDeadline}T00:00:00.000Z`).toISOString()
      : null,
  };
}

export function useEditJobForm(organizationId: number, job: Job) {
  const router = useRouter();
  const { mutateAsync, isPending } = useUpdateJob(organizationId);

  const form = useForm({
    defaultValues: mapJobToFormValues(job),
    validators: {
      onChange: createJobSchema,
    },
    onSubmit: async (values) => {
      await mutateAsync({
        jobId: job.id,
        data: transformFormValues(values.value),
      });
      router.push(`/employer/organizations/${organizationId}/jobs`);
    },
  });

  return { form: form as JobFormApi, isPending, organizationId };
}
