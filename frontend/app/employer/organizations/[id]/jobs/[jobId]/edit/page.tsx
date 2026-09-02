import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getJobById } from "@/lib/api/jobs";

const EditJobForm = dynamic(
  () =>
    import("./components/EditJobForm").then((mod) => ({
      default: mod.EditJobForm,
    })),
  {
    loading: () => (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-[200px] w-full rounded-md" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-4">
          <Skeleton className="h-10 w-20 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>
    ),
  },
);

interface PageProps {
  params: Promise<{ id: string; jobId: string }>;
}

export default async function EditJobPage({ params }: PageProps) {
  const { id, jobId } = await params;
  const organizationId = Number(id);
  const response = await getJobById(Number(jobId));

  if (!response.success || !response.data?.job) {
    notFound();
  }

  const { job } = response.data;

  if (job.employerId !== organizationId) {
    notFound();
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-foreground text-2xl font-bold">Edit Job Listing</h1>
      <p className="text-secondary-foreground mt-1 mb-8 text-sm">
        Update the details for &ldquo;{job.title}&rdquo;
      </p>
      <EditJobForm organizationId={organizationId} job={job} />
    </div>
  );
}
