import { redirect } from "next/navigation";
import { getJobById, getUserInformation } from "@/lib/api";
import {
  ApplicationFooter,
  ApplicationHeader,
  JobContextSidebar,
} from "./components";
import { MainContent } from "@/app/(main)/applications/new/components/MainContent";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ApplyForJob({ searchParams }: Props) {
  const params = await searchParams;
  const jobId =
    typeof params.jobId === "string" ? parseInt(params.jobId) : null;

  if (!jobId) {
    redirect("/");
  }

  const [userProfileRes, jobRes] = await Promise.all([
    getUserInformation(),
    getJobById(jobId),
  ]);

  if (!userProfileRes.success) {
    redirect(`/sign-in?redirect=/applications/new?jobId=${jobId}`);
  }

  if (!jobRes.success) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Job not found</h1>
          <p className="text-slate-500">
            The job you are looking for does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans md:p-8">
      <div className="mx-auto max-w-6xl">
        <ApplicationHeader />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <JobContextSidebar
            job={jobRes.data.data.job}
            employer={jobRes.data.data.employer}
          />

          {/* RIGHT COLUMN: Application Flow */}
          <div className="lg:col-span-8">
            <div className="flex min-h-[600px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
              {/* Main Content Area */}
              <MainContent jobId={jobId} userProfile={userProfileRes.data} />
              <ApplicationFooter />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
