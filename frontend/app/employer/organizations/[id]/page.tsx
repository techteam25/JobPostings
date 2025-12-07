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
import { EmployeeListSection } from "@/app/employer/organizations/[id]/components/MemberInformation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const organization = await getOrganizationAction(Number(id));

  if (!organization) {
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
              <CompanyInformation organization={organization} />
            </TabsContent>
            <TabsContent value="members">
              <EmployeeListSection members={organization.members} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
