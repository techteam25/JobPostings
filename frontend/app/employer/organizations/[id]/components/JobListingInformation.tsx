"use client";

import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Job } from "@/schemas/responses/jobs";
import { PaginatedApiResponse } from "@/lib/types";
import {
  useUpdateJob,
  useCreateJob,
} from "@/app/employer/organizations/hooks/use-manage-jobs";
import { useJobListingFilters } from "@/app/employer/organizations/[id]/hooks/use-job-listing-filters";
import { JobListingTable } from "./JobListingTable";

interface JobListingInformationProps {
  jobsList: PaginatedApiResponse<Job>;
  organizationId: number;
}

export function JobListingsSection({
  jobsList,
  organizationId,
}: JobListingInformationProps) {
  const { activeTab, setActiveTab, searchTerm, setSearchTerm, filteredJobs } =
    useJobListingFilters(jobsList.data);
  const { mutateAsync: updateJobAsync } = useUpdateJob(organizationId);
  const { mutateAsync: createJobAsync } = useCreateJob(organizationId);

  const handleCloseJob = async (jobId: number) => {
    await updateJobAsync({ jobId, data: { isActive: false } });
  };

  const handleDuplicate = async (job: Job) => {
    await createJobAsync({
      title: `${job.title} (Copy)`,
      description: job.description,
      city: job.city,
      state: job.state || "",
      country: job.country,
      zipcode: job.zipcode,
      jobType: job.jobType,
      compensationType: job.compensationType,
      isRemote: job.isRemote,
      applicationDeadline: job.applicationDeadline
        ? new Date(job.applicationDeadline).toISOString().split("T")[0]
        : null,
      experience: job.experience || "",
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div>
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-semibold">
              Your Job Listings
            </h1>
            <p className="text-secondary-foreground mt-1 text-sm">
              Manage all your jobs in one place
            </p>
          </div>
          <Link href={`/employer/organizations/${organizationId}/jobs/new`}>
            <Button className="bg-primary/90 hover:bg-primary cursor-pointer [&_svg]:size-4">
              <Plus className="size-4" />
              Post new job
            </Button>
          </Link>
        </div>

        {/* Table Section */}
        <Card className="w-full border-0 shadow-sm">
          <div className="border-b p-6">
            {/* Status Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mb-4"
            >
              <TabsList className="bg-background grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="expiring">Expiring soon</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                  <Input
                    placeholder="Search by job title or location..."
                    className="w-64 pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-secondary-foreground text-sm">
                Total Jobs: {filteredJobs.length} jobs
              </span>
            </div>

            <JobListingTable
              jobs={filteredJobs}
              organizationId={organizationId}
              onCloseJob={handleCloseJob}
              onDuplicate={handleDuplicate}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

export function JobListingsSectionSkeleton() {
  return (
    <div className="min-h-screen p-8">
      <div>
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Skeleton className="h-8 w-64 rounded-md" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>

        <Card className="w-full border-0 shadow-sm">
          <div className="border-b p-6">
            <div className="mb-4 grid w-full max-w-md grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-md" />
              ))}
            </div>
            <Skeleton className="h-10 w-64 rounded-md" />
          </div>

          <div className="p-6">
            <Skeleton className="mb-4 h-4 w-32" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, row) => (
                <div key={row} className="grid grid-cols-6 items-center gap-4">
                  <div>
                    <Skeleton className="mb-2 h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
