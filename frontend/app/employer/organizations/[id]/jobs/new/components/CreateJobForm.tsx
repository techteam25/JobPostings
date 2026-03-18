"use client";

import { useCreateJobForm } from "../hooks/use-create-job-form";
import { JobBasicInfoSection } from "./JobBasicInfoSection";
import { JobLocationSection } from "./JobLocationSection";
import { JobDetailsSection } from "./JobDetailsSection";
import { JobFormActions } from "./JobFormActions";

interface CreateJobFormProps {
  organizationId: number;
}

export function CreateJobForm({ organizationId }: CreateJobFormProps) {
  const { form, isPending } = useCreateJobForm(organizationId);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }}
      className="space-y-6"
    >
      <JobBasicInfoSection form={form} />
      <JobLocationSection form={form} />
      <JobDetailsSection form={form} />
      <JobFormActions
        form={form}
        isPending={isPending}
        organizationId={organizationId}
      />
    </form>
  );
}
