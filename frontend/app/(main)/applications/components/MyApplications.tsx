"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowRight,
  Search,
  Filter,
  Bookmark,
  Calendar,
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { PaginatedApiResponse, UserJobApplications } from "@/lib/types";

interface MyApplicationsProps {
  applications: PaginatedApiResponse<UserJobApplications>;
}
export default function MyApplications({ applications }: MyApplicationsProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome Back, Rayden!
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Your Career Journey Starts Here. Track and Manage Your
              Applications Seamlessly.
            </p>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search" className="w-full pl-10 sm:w-80" />
            </div>
            <Button className="bg-purple-600 whitespace-nowrap hover:bg-purple-700">
              Post Resume
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-full p-6 lg:p-8">
        {/* Top Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-5 md:grid-cols-4">
          {[
            {
              title: "Total Applications Sent",
              value: "60",
              desc: "Overview of all submitted applications",
              icon: Users,
              color: "purple",
            },
            {
              title: "Active Applications",
              value: "38",
              desc: "Ongoing applications in progress",
              icon: Briefcase,
              color: "purple",
            },
            {
              title: "Waiting for Interview",
              value: "15",
              desc: "Applications in the interview queue",
              icon: Clock,
              color: "purple",
            },
            {
              title: "Offer Received",
              value: "7",
              desc: "Job offers received from employers",
              icon: CheckCircle2,
              color: "purple",
            },
          ].map((stat, i) => (
            <Card
              key={i}
              className="relative overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className={`rounded-xl p-3 bg-${stat.color}-100`}>
                    <stat.icon className={`h-7 w-7 text-${stat.color}-600`} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-4xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <p className="mt-2 text-sm text-gray-600">{stat.title}</p>
                <p className="mt-1 text-xs text-gray-500">{stat.desc}</p>
              </CardContent>
              <div
                className={`absolute top-0 right-0 h-32 w-32 bg-${stat.color}-500 -mt-12 -mr-12 rounded-full opacity-10 blur-3xl`}
              />
            </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Latest Application Status Table */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <div className="border-b p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Latest Application Status
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input placeholder="Search" className="w-64 pl-10" />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="w-10">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      company: "Gojek",
                      location: "West Jakarta, Jakarta",
                      position: "UI/UX Designer",
                      status: "Accepted",
                      color: "green",
                      time: "Today, 12:46PM",
                    },
                    {
                      company: "Shopee Indonesia",
                      location: "South Jakarta, Jakarta",
                      position: "Web Designer",
                      status: "Accepted",
                      color: "green",
                      time: "Today, 12:46PM",
                    },
                    {
                      company: "Traveloka",
                      location: "Bandung, West Java",
                      position: "UI Designer",
                      status: "Interview",
                      color: "blue",
                      time: "Yesterday, 12:46PM",
                    },
                    {
                      company: "Agoda",
                      location: "North Jakarta, Jakarta",
                      position: "Motion Designer",
                      status: "In Progress",
                      color: "amber",
                      time: "25 November 2024",
                    },
                    {
                      company: "Tokopedia",
                      location: "Tangerang, Banten",
                      position: "UX Researcher",
                      status: "Rejected",
                      color: "red",
                      time: "24 November 2024",
                    },
                  ].map((job, i) => (
                    <TableRow key={i} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={`/logos/${job.company.toLowerCase()}.png`}
                            />
                            <AvatarFallback>{job.company[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{job.company}</div>
                            <div className="text-xs text-gray-500">
                              {job.location}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {job.position}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            job.color === "green"
                              ? "bg-green-100 text-green-700"
                              : job.color === "blue"
                                ? "bg-blue-100 text-blue-700"
                                : job.color === "amber"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                          } border-0`}
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {job.time}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between border-t p-4">
                <span className="text-sm text-gray-600">Page 1 of 12</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Recommended Jobs */}
          <div>
            <Card className="border-0 shadow-sm">
              <div className="flex items-center justify-between border-b p-6">
                <h2 className="text-lg font-semibold">Recommended Jobs</h2>
                <Button variant="ghost" size="sm" className="text-purple-600">
                  See All
                </Button>
              </div>
              <div className="space-y-5 p-6">
                {[
                  {
                    title: "UI/UX Designer",
                    company: "Gojek",
                    location: "West Jakarta, Jakarta",
                    days: "2 days ago",
                  },
                  {
                    title: "Web Designer",
                    company: "Shopee Indonesia",
                    location: "South Jakarta, Jakarta",
                    days: "2 days ago",
                  },
                  {
                    title: "UI Designer",
                    company: "Traveloka",
                    location: "Bandung, West Java",
                    days: "2 days ago",
                  },
                ].map((job, i) => (
                  <div
                    key={i}
                    className="group flex cursor-pointer items-start justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg border-2 border-dashed bg-gray-200" />
                      <div>
                        <h4 className="font-medium group-hover:text-purple-600">
                          {job.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {job.company} • {job.location}
                        </p>
                        <span className="mt-1 inline-block text-xs text-gray-500">
                          {job.days}
                        </span>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
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
        {/* Top Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-5 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-lg border-0 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-6 w-6" />
              </div>
              <Skeleton className="h-10 w-24" />
              <Skeleton className="mt-2 h-4 w-40" />
              <Skeleton className="mt-1 h-3 w-32" />
              <div className="absolute top-0 right-0 -mt-12 -mr-12 h-32 w-32 rounded-full bg-gray-200 opacity-10 blur-3xl" />
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Latest Application Status (main column) */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border-0 bg-white shadow-sm">
              <div className="border-b p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Skeleton className="h-6 w-48" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-64 rounded-md" />
                    <Skeleton className="h-10 w-24 rounded-md" />
                  </div>
                </div>
              </div>

              {/* Table header */}
              <div className="overflow-x-auto">
                <div className="bg-white">
                  <div className="grid grid-cols-6 gap-4 border-b bg-gray-50 p-4">
                    <Skeleton className="h-4 w-6" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <div className="flex justify-end">
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>

                  {/* Table rows */}
                  <div className="divide-y">
                    {Array.from({ length: 6 }).map((_, row) => (
                      <div
                        key={row}
                        className="grid grid-cols-6 items-center gap-4 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div>
                            <Skeleton className="mb-2 h-4 w-36" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>

                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-20" />
                        <div className="flex justify-end">
                          <Skeleton className="h-8 w-12 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t p-4">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-10 rounded-md" />
                  <Skeleton className="h-8 w-10 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Jobs (sidebar) */}
          <div>
            <div className="rounded-lg border-0 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b p-6">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-20" />
              </div>

              <div className="space-y-5 p-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="group flex cursor-pointer items-start justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div>
                        <Skeleton className="mb-2 h-4 w-40" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="mt-1 h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-10 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
