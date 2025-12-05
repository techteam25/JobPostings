"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, MoreVertical, Plus } from "lucide-react";

export function JobListingsSection() {
  const jobs = [
    {
      id: 1,
      title: "Registered Nurse",
      branch: "Rich memorial lapaz branch",
      applicants: 124,
      posted: "21 June 2025",
      closing: "28 July 2025",
      status: "Open",
    },
    {
      id: 2,
      title: "Lab Technician",
      branch: "Lapaz memorial hospital main branch",
      applicants: 3,
      posted: "21 June 2025",
      closing: "28 July 2025",
      status: "Expiring",
    },
    {
      id: 3,
      title: "Vet Doctor",
      branch: "Rich memorial centre kasoa branch",
      applicants: 47,
      posted: "21 June 2025",
      closing: "28 July 2025",
      status: "Open",
    },
    {
      id: 4,
      title: "Heart Surgeon",
      branch: "Rich memorial centre kasoa branch",
      applicants: 47,
      posted: "21 June 2025",
      closing: "28 July 2025",
      status: "Open",
    },
    {
      id: 5,
      title: "Lab Technician",
      branch: "Lapaz memorial hospital main branch",
      applicants: 3,
      posted: "21 June 2025",
      closing: "28 July 2025",
      status: "Expiring",
    },
    {
      id: 6,
      title: "Medical Doctor",
      branch: "Rich memorial clinic dome branch",
      applicants: 55,
      posted: "21 June 2025",
      closing: "28 July 2025",
      status: "Expired",
    },
    {
      id: 7,
      title: "Medical Doctor",
      branch: "Rich memorial clinic dome branch",
      applicants: 55,
      posted: "21 June 2025",
      closing: "28 July 2025",
      status: "Expired",
    },
    {
      id: 8,
      title: "Surgeon",
      branch: "Rich memorial hospital main branch",
      applicants: 101,
      posted: "21 June 2025",
      closing: "28 July 2025",
      status: "Open",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return (
          <Badge className="border-green-200 bg-green-100 text-green-700 hover:bg-green-200">
            Open
          </Badge>
        );
      case "Expiring":
        return (
          <Badge className="border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200">
            Expiring
          </Badge>
        );
      case "Expired":
        return (
          <Badge className="border-red-200 bg-red-100 text-red-700 hover:bg-red-200">
            Expired
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div>
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Your Job Listings
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage all your jobs in one place
            </p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Post new job
          </Button>
        </div>

        {/* Filters & Tabs */}
        <Card className="border-0 shadow-sm">
          <div className="p-6">
            {/* Status Tabs */}
            <Tabs defaultValue="all" className="mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-4 bg-gray-100">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="expiring">Expiring soon</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search & Filters */}
            <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
              <div className="relative max-w-md flex-1">
                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by job title or location..."
                  className="bg-white pl-10"
                />
              </div>

              <div className="flex gap-3">
                <Select defaultValue="all">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="nursing">Nursing</SelectItem>
                    <SelectItem value="lab">Laboratory</SelectItem>
                    <SelectItem value="surgery">Surgery</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Date
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Job title</TableHead>
                  <TableHead>Applicants</TableHead>
                  <TableHead>Date posted</TableHead>
                  <TableHead>Closing date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {job.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {job.branch}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{job.applicants}</span>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {job.posted}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {job.closing}
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Options
                            <MoreVertical className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Applicants</DropdownMenuItem>
                          <DropdownMenuItem>Edit Job</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Close Job
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
