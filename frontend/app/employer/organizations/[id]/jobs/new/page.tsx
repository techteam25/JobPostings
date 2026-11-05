import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const CreateJobForm = dynamic(
  () =>
    import("./components/CreateJobForm").then((mod) => ({
      default: mod.CreateJobForm,
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
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>
    ),
  },
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CreateJobPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-foreground text-2xl font-bold">Post a New Job</h1>
      <p className="text-secondary-foreground mt-1 mb-8 text-sm">
        Fill in the details below to create a new job posting
      </p>
      <CreateJobForm organizationId={Number(id)} />
    </div>
  );
}
