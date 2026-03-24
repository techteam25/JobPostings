"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyInformation from "../components/CompanyInformation";
import { useOrganization, useIsOwner } from "../context/organization-context";

const EmployeeListSection = dynamic(
  () =>
    import("../components/MemberInformation").then((mod) => ({
      default: mod.EmployeeListSection,
    })),
  {
    loading: () => (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
        <div className="grid grid-cols-4 gap-4 border-b pb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 items-center gap-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        ))}
      </div>
    ),
  },
);

export default function SettingsPage() {
  const { organization } = useOrganization();
  const isOwner = useIsOwner();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Company Settings</h1>
          {isOwner && (
            <Button asChild>
              <Link
                href={`/employer/organizations/${organization.id}/settings/edit`}
              >
                <Pencil data-icon="inline-start" />
                Edit Organization
              </Link>
            </Button>
          )}
        </div>

        <div className="border-border mb-6 flex gap-6 border-b">
          <Tabs defaultValue="company" className="w-full">
            <TabsList>
              <TabsTrigger
                value="company"
                className="data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none bg-transparent px-6 data-[state=active]:border-b-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Company
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none bg-transparent px-6 data-[state=active]:border-b-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Members
              </TabsTrigger>
            </TabsList>
            <TabsContent value="company">
              <CompanyInformation organization={organization} />
            </TabsContent>
            <TabsContent value="members">
              <EmployeeListSection
                members={organization.members}
                organizationId={organization.id}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
