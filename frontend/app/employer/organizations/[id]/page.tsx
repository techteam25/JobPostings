import dynamic from "next/dynamic";
import CompanyInformation from "@/app/employer/organizations/[id]/components/CompanyInformation";
import { getOrganizationAction } from "@/app/employer/organizations/[id]/actions/getOrganizationAction";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CircleOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const EmployeeListSection = dynamic(
  () =>
    import(
      "@/app/employer/organizations/[id]/components/MemberInformation"
    ).then((mod) => ({ default: mod.EmployeeListSection })),
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const result = await getOrganizationAction(Number(id));

  if (!result.success) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleOff />
          </EmptyMedia>
          <EmptyTitle>No organization</EmptyTitle>
          <EmptyDescription>No organization found</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <p>No organization information found</p>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Company Settings</h1>

        {/* Tabs */}
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
              <CompanyInformation organization={result.data} />
            </TabsContent>
            <TabsContent value="members">
              <EmployeeListSection members={result.data.members} organizationId={result.data.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
