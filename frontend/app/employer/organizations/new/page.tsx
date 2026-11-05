import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CreateOrganizationWrapper from "@/components/employer/CreateOrganizationWrapper";

export default function NewOrganizationPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft data-icon="inline-start" />
          Back to home
        </Link>
      </div>
      <div className="flex justify-center">
        <CreateOrganizationWrapper />
      </div>
    </div>
  );
}
