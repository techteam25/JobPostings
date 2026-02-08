import { CreateJobForm } from "./components/CreateJobForm";

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
