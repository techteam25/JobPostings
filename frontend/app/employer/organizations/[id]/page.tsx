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
import { Button } from "@/components/ui/button";

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
          <EmptyTitle>No data</EmptyTitle>
          <EmptyDescription>No data found</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>Add data</Button>
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
          <button className="border-primary text-primary cursor-pointer border-b-2 pb-3 font-medium">
            Company
          </button>
          <button className="text-secondary-foreground/90 hover:text-secondary-foreground cursor-pointer pb-3">
            Members
          </button>
          <button className="text-secondary-foreground/90 hover:text-secondary-foreground cursor-pointer pb-3">
            Jobs
          </button>
          <button className="text-secondary-foreground/90 hover:text-secondary-foreground cursor-pointer pb-3">
            Advanced
          </button>
        </div>

        <CompanyInformation organization={organization} />
      </div>
    </div>
  );
}
