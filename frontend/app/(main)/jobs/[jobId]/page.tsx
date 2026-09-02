import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Suspense } from "react";

import { JobDetailPanel } from "@/app/(main)/components/JobDetailPanel";
import { JobDetailPanelSkeleton } from "@/app/(main)/components/JobsWrapper";

type Props = {
  params: Promise<{ jobId: string }>;
};

export default async function JobDetailPage({ params }: Props) {
  const { jobId } = await params;
  const id = Number.parseInt(jobId, 10);

  if (!Number.isFinite(id) || id <= 0) {
    notFound();
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/saved"
          className="text-foreground mb-6 inline-flex items-center text-sm font-medium hover:underline"
        >
          <ChevronLeft className="mr-1 size-4" />
          Back to Saved Jobs
        </Link>
        <Suspense fallback={<JobDetailPanelSkeleton />}>
          <JobDetailPanel jobId={id} />
        </Suspense>
      </div>
    </div>
  );
}
