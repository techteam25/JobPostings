"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useOrganization,
  useIsOwner,
} from "../../context/organization-context";
import { EditOrganizationForm } from "./components/edit-organization-form";
import { DangerZone } from "./components/danger-zone";

export default function EditOrganizationPage() {
  const { organization } = useOrganization();
  const isOwner = useIsOwner();
  const router = useRouter();

  useEffect(() => {
    if (!isOwner) {
      router.replace(`/employer/organizations/${organization.id}/settings`);
    }
  }, [isOwner, organization.id, router]);

  if (!isOwner) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/employer/organizations/${organization.id}/settings`}>
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Organization</h1>
      </div>

      <EditOrganizationForm />

      <Separator />

      <DangerZone />
    </div>
  );
}
