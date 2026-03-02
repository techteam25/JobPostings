"use client";

import { Skeleton } from "@/components/ui/skeleton";

import {
  PaginatedApiResponse,
  UserJobApplication,
  UserJobApplications,
} from "@/lib/types";
import { ApplicationsStatsBar } from "./ApplicationsStatsBar";
import { ApplicationsGrid } from "./ApplicationsGrid";

interface MyApplicationsProps {
  applications: PaginatedApiResponse<UserJobApplications>;
}

const calculateStats = (apps: UserJobApplication[]) => {
  const total = apps.length;
  const active = apps.filter((a) =>
    ["pending", "reviewed", "shortlisted", "interviewing"].includes(
      a.application.status,
    ),
  ).length;
  const interviewing = apps.filter(
    (a) => a.application.status === "interviewing",
  ).length;
  const hired = apps.filter((a) => a.application.status === "hired").length;

  return { total, active, interviewing, hired };
};

export default function MyApplications({ applications }: MyApplicationsProps) {
  // The data field contains UserJobApplications which is already an array
  const applicationsData = applications.data as unknown as UserJobApplication[];

  // Transform API data for display
  const displayApplications = applicationsData.map((item) => ({
    applicationId: item.application.id,
    jobId: item.job.id,
    employerId: item.employer.id,
    companyName: item.employer.name,
    jobTitle: item.job.title,
    location: `${item.job.city}${item.job.state ? ", " + item.job.state : ""}${item.job.country ? ", " + item.job.country : ""}`,
    jobType: item.job.jobType,
    isRemote: item.job.isRemote,
    status: item.application.status,
    appliedAt: new Date(item.application.appliedAt),
  }));

  const stats = calculateStats(applicationsData);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Applications
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Track and manage your job applications
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-full p-6 lg:p-8">
        {/* Stats Bar */}
        <ApplicationsStatsBar {...stats} />

        {/* Applications Grid */}
        <ApplicationsGrid applications={displayApplications} />
      </div>
    </div>
  );
}

export function MyApplicationsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row">
          <div>
            <Skeleton className="h-8 w-64 rounded-md" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Skeleton className="h-10 w-full rounded-md pl-10" />
            </div>
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
      </header>

      <div className="max-w-full p-6 lg:p-8">
        {/* Stats Bar Skeleton */}
        <div className="mb-8 rounded-lg border-0 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="mt-1 h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Applications Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-white p-6 shadow-sm">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>

              {/* Title */}
              <Skeleton className="mb-2 h-6 w-full" />

              {/* Location */}
              <Skeleton className="mb-3 h-4 w-32" />

              {/* Badges */}
              <div className="mb-4 flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>

              {/* Status */}
              <Skeleton className="mb-4 h-6 w-20" />

              {/* Applied Date */}
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
