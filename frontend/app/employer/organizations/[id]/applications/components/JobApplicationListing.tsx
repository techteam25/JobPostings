"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase,
  Users,
  UserCheck,
  UserX,
  CheckCircle2,
  Clock,
  Calendar,
  Construction,
} from "lucide-react";
import { OrganizationJobApplications, PaginatedApiResponse } from "@/lib/types";

interface JobApplicationListingProps {
  applications: PaginatedApiResponse<OrganizationJobApplications>;
}

type StatusKey =
  | "pending"
  | "reviewed"
  | "shortlisted"
  | "interviewing"
  | "rejected"
  | "hired"
  | "withdrawn";

export const JobApplicationListing = ({
  applications,
}: JobApplicationListingProps) => {
  const appData = applications.data;

  const stats = useMemo(() => {
    const uniqueJobIds = new Set(appData.map((a) => a.jobId));
    const total = applications.pagination.total;
    const newCount = appData.filter((a) => a.status === "pending").length;
    const activeCount = appData.filter((a) =>
      ["reviewed", "shortlisted", "interviewing"].includes(a.status),
    ).length;
    const rejectedCount = appData.filter((a) => a.status === "rejected").length;
    const hiredCount = appData.filter((a) => a.status === "hired").length;

    return {
      totalJobOpenings: uniqueJobIds.size,
      totalApplied: total,
      new: newCount,
      active: activeCount,
      rejected: rejectedCount,
      hired: hiredCount,
    };
  }, [appData, applications.pagination.total]);

  const jobGroups = useMemo(() => {
    const groups = new Map<
      number,
      {
        jobId: number;
        jobTitle: string;
        organizationName: string;
        applications: OrganizationJobApplications[];
        statusCounts: Record<StatusKey, number>;
      }
    >();

    for (const app of appData) {
      if (!groups.has(app.jobId)) {
        groups.set(app.jobId, {
          jobId: app.jobId,
          jobTitle: app.jobTitle,
          organizationName: app.organizationName,
          applications: [],
          statusCounts: {
            pending: 0,
            reviewed: 0,
            shortlisted: 0,
            interviewing: 0,
            rejected: 0,
            hired: 0,
            withdrawn: 0,
          },
        });
      }
      const group = groups.get(app.jobId)!;
      group.applications.push(app);
      group.statusCounts[app.status as StatusKey] =
        (group.statusCounts[app.status as StatusKey] || 0) + 1;
    }

    return Array.from(groups.values());
  }, [appData]);

  const statCards = [
    {
      label: "Total Job Openings",
      value: stats.totalJobOpenings,
      icon: Briefcase,
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      label: "Total Applied",
      value: stats.totalApplied,
      icon: Users,
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
    },
    {
      label: "New",
      value: stats.new,
      icon: Clock,
      bgColor: "bg-pink-100",
      textColor: "text-pink-600",
    },
    {
      label: "Active",
      value: stats.active,
      icon: UserCheck,
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-600",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: UserX,
      bgColor: "bg-red-100",
      textColor: "text-red-600",
    },
    {
      label: "Hired",
      value: stats.hired,
      icon: CheckCircle2,
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
  ];

  const pipelineStages: { label: string; key: StatusKey }[] = [
    { label: "New", key: "pending" },
    { label: "Reviewed", key: "reviewed" },
    { label: "Shortlisted", key: "shortlisted" },
    { label: "Interview", key: "interviewing" },
    { label: "Rejected", key: "rejected" },
    { label: "Hired", key: "hired" },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-screen-2xl px-4 py-8 lg:px-8 lg:py-10">
        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className="border-0 shadow-sm transition-shadow hover:shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          {/* Left Column: Job Listed + Interview Schedules */}
          <div className="space-y-8 xl:col-span-2">
            {/* Job Listed */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Jobs Listed ({jobGroups.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {jobGroups.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    No applications received yet.
                  </p>
                ) : (
                  jobGroups.map((group, index) => {
                    const totalApps = group.applications.length;
                    const hiredCount = group.statusCounts.hired;
                    const isComplete = hiredCount > 0;

                    return (
                      <div key={group.jobId}>
                        {index > 0 && <Separator className="mb-6" />}
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{group.jobTitle}</h3>
                            <p className="text-sm text-gray-600">
                              {totalApps} applicant
                              {totalApps !== 1 ? "s" : ""} &middot;{" "}
                              {group.organizationName}
                            </p>
                          </div>
                          {isComplete ? (
                            <Badge className="bg-green-100 text-green-700">
                              Hired
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-blue-300 text-blue-700"
                            >
                              Open
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-6 gap-4 text-center text-sm">
                          {pipelineStages.map((stage) => {
                            const count = group.statusCounts[stage.key] || 0;
                            const isHighest =
                              count > 0 &&
                              count ===
                                Math.max(
                                  ...pipelineStages.map(
                                    (s) => group.statusCounts[s.key] || 0,
                                  ),
                                );

                            return (
                              <div
                                key={stage.key}
                                className={
                                  isHighest
                                    ? "font-medium text-purple-600"
                                    : ""
                                }
                              >
                                <div className="mb-2 flex justify-center -space-x-2">
                                  {count > 0 && (
                                    <Avatar className="h-7 w-7 border-2 border-white">
                                      <AvatarFallback className="text-xs">
                                        {count}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {stage.label}
                                </p>
                                <p className="font-semibold">{count}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Interview Schedules - Coming Soon */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Interview Schedules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-gray-100 p-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mb-1 text-lg font-medium text-gray-700">
                    Coming Soon
                  </h3>
                  <p className="max-w-sm text-sm text-gray-500">
                    Interview scheduling will be available in a future update.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Activity + Task */}
          <div className="space-y-8">
            {/* Activity - Coming Soon */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-gray-100 p-4">
                    <Construction className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mb-1 text-lg font-medium text-gray-700">
                    Coming Soon
                  </h3>
                  <p className="max-w-sm text-sm text-gray-500">
                    Activity tracking will be available in a future update.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Task - Coming Soon */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-gray-100 p-4">
                    <Construction className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mb-1 text-lg font-medium text-gray-700">
                    Coming Soon
                  </h3>
                  <p className="max-w-sm text-sm text-gray-500">
                    Task management will be available in a future update.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
