"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fakeJobs } from "@/assets/jobs";
import { JobCard } from "@/components/JobCard";
import { JobType } from "@/lib/types";
import FilterOptionsCard from "@/app/(main)/_components/FilterOptionsCard";

export default function Home() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <div className="from-brand-blue rounded-2xl bg-gradient-to-r to-[#003BA3] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              The Right Job is Waiting for You
            </h1>
            <p className="mb-8 font-serif text-sm text-white/90">
              Explore thousands of jobs and take the next step in your career
              today!
            </p>

            {/* Search Bar */}
            <div className="flex items-center overflow-hidden rounded-full bg-white shadow-lg">
              <div className="flex flex-1 items-center px-6 py-4">
                <Search className="mr-1 size-6 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search here..."
                  className="flex-1 text-lg text-gray-700 outline-none"
                />
              </div>
              <Button className="bg-brand-blue mr-1 h-full rounded-full px-10 py-4 font-semibold text-white transition hover:bg-[#003BA3]">
                Search Job
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Jobs Section */}
      <div className="mt-6 min-h-screen rounded-2xl bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Filter Sidebar */}
            <FilterOptionsCard />
            {/* Jobs List */}
            <div className="col-span-9">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold">
                    Explore All Jobs (23,129 Jobs Available)
                  </h2>
                  <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                      />
                    </svg>
                    Sort By
                  </button>
                </div>

                {/* Job Cards */}
                <div className="space-y-4">
                  {fakeJobs.map((job, index) => (
                    <JobCard
                      key={index}
                      jobType={job.jobType as JobType}
                      jobDescription={job.jobDescription}
                      companyName={job.companyName}
                      experienceLevel={job.experienceLevel}
                      location={job.location}
                      positionName={job.positionName}
                      posted={job.posted}
                      onApply={job.onApply}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
