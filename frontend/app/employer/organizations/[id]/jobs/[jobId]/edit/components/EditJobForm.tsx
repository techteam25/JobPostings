"use client";

import type { Job } from "@/schemas/responses/jobs";
import { useEditJobForm } from "../hooks/use-edit-job-form";
import { JobBasicInfoSection } from "../../../new/components/JobBasicInfoSection";
import { JobLocationSection } from "../../../new/components/JobLocationSection";
import { JobDetailsSection } from "../../../new/components/JobDetailsSection";
import { JobFormActions } from "../../../new/components/JobFormActions";

interface EditJobFormProps {
  organizationId: number;
  job: Job;
}

export function EditJobForm({ organizationId, job }: EditJobFormProps) {
  const { form, isPending } = useEditJobForm(organizationId, job);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }}
      className="flex flex-col gap-6"
    >
      <JobBasicInfoSection form={form} />
      <JobLocationSection form={form} />
      <JobDetailsSection form={form} />
      <JobFormActions
        form={form}
        isPending={isPending}
        organizationId={organizationId}
        mode="edit"
      />
    </form>
  );
}
