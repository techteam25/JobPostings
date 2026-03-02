"use client";

import Link from "next/link";
import Image from "next/image";
import { Building2, ChevronRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserOrganizationMembership } from "@/lib/types";

interface OrgPickerProps {
  organizations: UserOrganizationMembership[];
}

export default function OrgPicker({ organizations }: OrgPickerProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Your Organizations</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Select an organization to manage
        </p>
      </div>

      <div className="grid gap-4">
        {organizations.map((membership) => (
          <Link
            key={membership.id}
            href={`/employer/organizations/${membership.organizationId}`}
          >
            <Card className="hover:border-primary/50 cursor-pointer transition-colors">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                  {membership.organization.logoUrl ? (
                    <Image
                      src={membership.organization.logoUrl}
                      alt={membership.organization.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="text-muted-foreground h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {membership.organization.name}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant="secondary" className="mt-1 capitalize">
                      {membership.role}
                    </Badge>
                  </CardDescription>
                </div>
                <ChevronRight className="text-muted-foreground h-5 w-5" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
