import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProfileBreadcrumb } from "@/app/(main)/me/profile/components/ProfileBreadcrumb";

function Page() {
  return (
    <Empty>
      <EmptyHeader>
        <ProfileBreadcrumb />
        <EmptyMedia variant="icon">
          <Construction className="size-16 text-amber-400" />
        </EmptyMedia>
        <EmptyTitle>Coming Soon</EmptyTitle>
        <EmptyDescription>
          Preferences page is under construction. Please check back later.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/">Browse Jobs</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export default Page;
