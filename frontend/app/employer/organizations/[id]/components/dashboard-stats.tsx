"use client";

import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  CheckCircle,
  FileText,
  Users,
  Clock,
  Eye,
  UserCheck,
  UserX,
  Search,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { StatsCard, StatsCardSkeleton } from "./stats-card";
import { useOrganization } from "../context/organization-context";
import { useFetchJobStats } from "../hooks/use-fetch-job-stats";

export function DashboardStats() {
  const { organization } = useOrganization();
  const { stats, error, isLoading } = useFetchJobStats(organization.id);

  return (
    <section
      aria-label="Dashboard Statistics"
      className="flex flex-col gap-6 p-6"
    >
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)
        ) : error ? (
          <div className="col-span-full">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Briefcase />
                </EmptyMedia>
                <EmptyTitle>Unable to load stats</EmptyTitle>
                <EmptyDescription>{error}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <p>Try refreshing the page</p>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <>
            <StatsCard
              title="Total Jobs"
              value={stats?.totalJobs ?? 0}
              icon={Briefcase}
              iconBgClass="bg-primary/10"
              iconColorClass="text-primary"
            />
            <StatsCard
              title="Active Jobs"
              value={stats?.activeJobs ?? 0}
              icon={CheckCircle}
              iconBgClass="bg-emerald-100 dark:bg-emerald-900/30"
              iconColorClass="text-emerald-600"
            />
            <StatsCard
              title="Total Applications"
              value={stats?.totalApplications ?? 0}
              icon={FileText}
              iconBgClass="bg-purple-100 dark:bg-purple-900/30"
              iconColorClass="text-purple-600"
            />
            <StatsCard
              title="Team Members"
              value={organization.members.length}
              icon={Users}
              iconBgClass="bg-orange-100 dark:bg-orange-900/30"
              iconColorClass="text-orange-600"
            />
          </>
        )}
      </div>

      {/* Applications by Status */}
      {stats?.applicationsByStatus && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Applications by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatusItem
                label="Pending"
                count={stats.applicationsByStatus.pending}
                icon={Clock}
                variant="secondary"
              />
              <StatusItem
                label="Reviewed"
                count={stats.applicationsByStatus.reviewed}
                icon={Eye}
                variant="secondary"
              />
              <StatusItem
                label="Shortlisted"
                count={stats.applicationsByStatus.shortlisted}
                icon={Search}
                variant="secondary"
              />
              <StatusItem
                label="Interviewing"
                count={stats.applicationsByStatus.interviewing}
                icon={UserCheck}
                variant="secondary"
              />
              <StatusItem
                label="Hired"
                count={stats.applicationsByStatus.hired}
                icon={Award}
                variant="default"
              />
              <StatusItem
                label="Rejected"
                count={stats.applicationsByStatus.rejected}
                icon={UserX}
                variant="destructive"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function StatusItem({
  label,
  count,
  icon: Icon,
  variant,
}: {
  label: string;
  count: number;
  icon: LucideIcon;
  variant: "default" | "secondary" | "destructive";
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center">
      <Icon className="text-muted-foreground size-5" />
      <p className="text-2xl font-bold">{count}</p>
      <Badge variant={variant}>{label}</Badge>
    </div>
  );
}
