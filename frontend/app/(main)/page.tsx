"use client";

import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fakeJobs } from "@/assets/jobs";
import { JobCard } from "@/components/JobCard";
import { JobType } from "@/lib/types";

export default function Home() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <div className="rounded-2xl bg-gradient-to-r from-[#001B71] to-[#003BA3] px-6 py-20">
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
              <Button className="mr-1 h-full rounded-full bg-[#001B71] px-10 py-4 font-semibold text-white transition hover:bg-[#003BA3]">
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
            <div className="col-span-3">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-bold">Filter</h2>

                {/* Salary Range */}
                <div className="mb-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Salary Range</h3>
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  </div>

                  <div className="mb-4 space-y-3">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input type="radio" name="salary" className="h-4 w-4" />
                      <span className="text-gray-700">Under $1,000</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                      <input type="radio" name="salary" className="h-4 w-4" />
                      <span className="text-gray-700">$1,000 - $5,000</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                      <input type="radio" name="salary" className="h-4 w-4" />
                      <span className="text-gray-700">$5,000 - $10,000</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="radio"
                        name="salary"
                        defaultChecked
                        className="h-4 w-4 accent-blue-900"
                      />
                      <span className="text-gray-700">Custom</span>
                    </label>
                  </div>

                  {/* Range Slider */}
                  <div className="mt-4">
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-orange-200 accent-blue-500"
                    />
                    <div className="mt-2 flex justify-between text-sm text-gray-600">
                      <span>$1,250</span>
                      <span>$2,900</span>
                    </div>
                  </div>
                </div>

                {/* Job Type */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Job Type</h3>
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" />
                      <span className="text-gray-700">Full-time</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" />
                      <span className="text-gray-700">Part-time</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" />
                      <span className="text-gray-700">Contract</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" />
                      <span className="text-gray-700">Temporary</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

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
