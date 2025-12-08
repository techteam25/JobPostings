"use client";

import { Search, MoreVertical, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { formatToReadableDate } from "@/lib/utils";

import { Job } from "@/schemas/responses/jobs";
import { PaginatedApiResponse } from "@/lib/types";

interface JobListingInformationProps {
  jobsList: PaginatedApiResponse<Job>;
}

export function JobListingsSection({ jobsList }: JobListingInformationProps) {
  const getStatusBadge = (status: boolean) => {
    switch (status) {
      case true:
        return (
          <Badge className="border-accent/80 bg-accent/10 text-accent/80 hover:bg-accent/20">
            Active
          </Badge>
        );
      // case "Expiring":
      //   return (
      //     <Badge className="border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200">
      //       Expiring
      //     </Badge>
      //   );
      case false:
        return (
          <Badge className="border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20">
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
            <h1 className="text-foreground text-2xl font-semibold">
              Your Job Listings
            </h1>
            <p className="text-secondary-foreground mt-1 text-sm">
              Manage all your jobs in one place
            </p>
          </div>
          <Button className="bg-primary/90 hover:bg-primary cursor-pointer [&_svg]:size-4">
            <Plus className="size-4" />
            Post new job
          </Button>
        </div>

        {/* Filters & Tabs */}
        <Card className="border-0 shadow-sm">
          <div className="p-6">
            {/* Status Tabs */}
            <Tabs defaultValue="all" className="mb-6">
              <TabsList className="bg-background grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="expiring">Expiring soon</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search & Filters */}
            <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
              <div className="relative max-w-md flex-1">
                <Search className="text-muted-foreground-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <Input
                  placeholder="Search by job title or location..."
                  className="bg-input/50 pl-10"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-background">
                  <TableHead>Job title</TableHead>
                  <TableHead>Location (City)</TableHead>
                  <TableHead>Date posted</TableHead>
                  <TableHead>Closing date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsList.data.map((job, idx) => {
                  return (
                    <TableRow key={job.id} className="hover:bg-background">
                      <TableCell className="font-medium">
                        <div>
                          <div className="text-foreground text-sm font-semibold">
                            {job.title}
                          </div>
                          <div className="text-secondary-foreground mt-1 text-xs">
                            {job.jobType}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{job.city}</span>
                      </TableCell>
                      <TableCell className="text-secondary-foreground">
                        {formatToReadableDate(job.createdAt)}
                      </TableCell>
                      <TableCell className="text-secondary-foreground">
                        {formatToReadableDate(job.applicationDeadline!)}
                      </TableCell>
                      <TableCell>{getStatusBadge(job.isActive)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-primary hover:text-primary-foreground [&_svg]:size-4"
                            >
                              Options
                              <MoreVertical className="ml-2" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Applicants</DropdownMenuItem>
                            <DropdownMenuItem>Edit Job</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Close Job
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Skeleton className="h-8 w-64 rounded-md" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>

        {/* Stats cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-background rounded-md p-4 shadow-sm">
              <Skeleton className="mb-3 h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>

        {/* Filters & Tabs (card) */}
        <div className="bg-background mb-6 rounded-md p-6 shadow-sm">
          {/* Tabs */}
          <div className="mb-6 grid w-full max-w-md grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>

          {/* Search & actions */}
          <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
            <div className="relative max-w-md flex-1">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="mt-2 flex items-center gap-2 lg:mt-0">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-36 rounded-md" />
            </div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="overflow-x-auto">
          <div className="bg-background rounded-md shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-6 gap-4 border-b p-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-28" />
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
                  className="hover:bg-background grid grid-cols-6 items-center gap-4 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
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
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
