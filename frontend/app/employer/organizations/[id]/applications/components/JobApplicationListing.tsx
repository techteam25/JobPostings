"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase,
  Users,
  UserCheck,
  UserX,
  CheckCircle2,
  Clock,
  Calendar,
  Phone,
  Video,
} from "lucide-react";
import { OrganizationJobApplications, PaginatedApiResponse } from "@/lib/types";

interface JobApplicationListingProps {
  applications: PaginatedApiResponse<OrganizationJobApplications>;
}
export const JobApplicationListing = ({
  applications,
}: JobApplicationListingProps) => {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-screen-2xl px-4 py-8 lg:px-8 lg:py-10">
        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            {
              label: "Total Job Opening",
              value: "125",
              icon: Briefcase,
              color: "blue",
            },
            {
              label: "Total Applied",
              value: "1474",
              icon: Users,
              color: "purple",
            },
            { label: "New", value: "428", icon: Clock, color: "pink" },
            {
              label: "Active",
              value: "812",
              icon: UserCheck,
              color: "emerald",
            },
            { label: "Reject", value: "132", icon: UserX, color: "red" },
            {
              label: "Hired",
              value: "102",
              icon: CheckCircle2,
              color: "green",
            },
          ].map((stat, i) => (
            <Card
              key={i}
              className="border-0 shadow-sm transition-shadow hover:shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`rounded-lg p-3 bg-${stat.color}-100`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
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
                  Job Listed (8)
                </CardTitle>
                <Button variant="link" className="text-sm text-purple-600">
                  See all
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Job 1 */}
                <div>
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">Golang Developer</h3>
                      <p className="text-sm text-gray-600">
                        Need: 1 · Company GGH · SaaS
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Done</Badge>
                  </div>

                  <div className="mb-3 flex items-center gap-6 text-sm">
                    <span className="text-xs text-gray-500">Budget Range</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-purple-500"
                        style={{ width: "65%" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-4 text-center text-sm">
                    {[
                      { label: "New", count: 22, active: false },
                      { label: "Screening", count: 75, active: true },
                      { label: "Shortlisted", count: 0, active: false },
                      { label: "Interview", count: 8, active: false },
                      { label: "Reject", count: 7, active: false },
                      { label: "Hired", count: 1, active: false },
                    ].map((stage) => (
                      <div
                        key={stage.label}
                        className={
                          stage.active ? "font-medium text-purple-600" : ""
                        }
                      >
                        <div className="mb-2 flex justify-center -space-x-2">
                          {stage.count > 0 && (
                            <Avatar className="h-7 w-7 border-2 border-white">
                              <AvatarFallback className="text-xs">
                                A
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {stage.count > 1 && (
                            <Avatar className="h-7 w-7 border-2 border-white">
                              <AvatarFallback className="text-xs">
                                B
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {stage.count > 2 && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-300 text-xs text-gray-700">
                              +{stage.count - 2}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{stage.label}</p>
                        <p className="font-semibold">{stage.count}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Posted 12/09/2023 to 31/10/2023
                  </p>
                </div>

                <Separator />

                {/* Job 2 - Repeat pattern */}
                <div>
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">Front-End Developer</h3>
                      <p className="text-sm text-gray-600">
                        Need: 3 · Company ABC · IT Consultant
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-blue-300 text-blue-700"
                    >
                      Open
                    </Badge>
                  </div>

                  <div className="mb-3 flex items-center gap-6 text-sm">
                    <span className="text-xs text-gray-500">Budget Range</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-purple-500"
                        style={{ width: "45%" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-4 text-center text-sm">
                    {[
                      { label: "New", count: 11 },
                      { label: "Screening", count: 122, active: true },
                      { label: "Shortlisted", count: 32 },
                      { label: "Interview", count: 2 },
                      { label: "Reject", count: 20 },
                      { label: "Hired", count: 0 },
                    ].map((stage) => (
                      <div
                        key={stage.label}
                        className={
                          stage.active ? "font-medium text-purple-600" : ""
                        }
                      >
                        <div className="mb-2 flex justify-center -space-x-2">
                          {stage.count > 0 && (
                            <Avatar className="h-7 w-7 border-2 border-white">
                              <AvatarFallback className="text-xs">
                                F
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {stage.count > 1 && (
                            <Avatar className="h-7 w-7 border-2 border-white">
                              <AvatarFallback className="text-xs">
                                G
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {stage.count > 2 && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-300 text-xs">
                              +{stage.count - 2}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{stage.label}</p>
                        <p className="font-semibold">{stage.count}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Posted 12/09/2023 to 31/10/2023
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Interview Schedules */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Interview Schedules
                </CardTitle>
                <Button variant="link" className="text-sm text-purple-600">
                  See all
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    name: "Kevin R",
                    title: "Back-End Developer",
                    company: "Company ABC · IT Consultant",
                    type: "HR Interview",
                    time: "Mon 29 Aug · 11:00 PM - 11:30 PM",
                    icon: Phone,
                  },
                  {
                    name: "James P",
                    title: "Back-End Developer",
                    company: "Company ABC · IT Consultant",
                    type: "User Interview",
                    time: "Mon 29 Aug · 11:30 PM - 12:00 PM",
                    icon: Video,
                  },
                ].map((interview) => (
                  <div
                    key={interview.name}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {interview.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{interview.name}</p>
                        <p className="text-sm text-gray-600">
                          {interview.title}
                          <br />
                          {interview.company}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{interview.type}</p>
                      <p className="text-gray-500">{interview.time}</p>
                      <div className="mt-2 flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                        >
                          <interview.icon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Activity + Task */}
          <div className="space-y-8">
            {/* Activity */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {[
                  "You move Rafly T to Shortlisted",
                  "Shandy move Brandon Rhiel Madsen to Shortlisted",
                  "Shandy move Gretchen Geidt to Shortlisted",
                  "Vanessa Watson move Martin Bergson to Rejected",
                  "Mira Mango move Martin Bergson to Rejected",
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-gray-400" />
                    <div className="flex-1">
                      <p className="text-gray-700">{activity}</p>
                      <p className="text-xs text-gray-500">
                        11:00PM 10/08/2023
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Task */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Follow up on offering letter for Rafly T",
                  "Follow up on Assignment test for Jessica",
                  "Follow up on Assignment test for Jenifer",
                  "HR Interview for Kevin R",
                  "User Interview for James P",
                ].map((task) => (
                  <div key={task} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full border-2 border-dashed border-gray-300" />
                      <p className="text-sm text-gray-700">{task}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
