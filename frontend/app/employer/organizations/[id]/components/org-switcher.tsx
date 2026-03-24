"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { instance } from "@/lib/axios-instance";
import { useOrganization } from "../context/organization-context";
import type { ApiResponse, UserOrganizationMembership } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const { organization } = useOrganization();

  const { data, isLoading } = useQuery({
    queryKey: ["user-organizations"],
    queryFn: async () => {
      const response = await instance.get<
        ApiResponse<UserOrganizationMembership[]>
      >("/users/me/organizations");
      return response.data;
    },
    enabled: open,
  });

  const organizations = data?.success && "data" in data ? data.data : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-label="Switch organization"
          className="flex w-full items-center justify-between gap-2 rounded-none border-b px-4 py-8"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Building2 className="text-primary" />
            </div>
            <span className="truncate font-bold">{organization.name}</span>
          </div>
          <ChevronsUpDown className="text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="flex flex-col gap-1 p-2">
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          ) : (
            organizations.map((membership) => (
              <Link
                key={membership.organizationId}
                href={`/employer/organizations/${membership.organizationId}`}
                onClick={() => setOpen(false)}
                className={cn(
                  "hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  membership.organizationId === organization.id && "bg-accent",
                )}
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md">
                  <Building2 className="text-muted-foreground" />
                </div>
                <span className="flex-1 truncate">
                  {membership.organization.name}
                </span>
                <Badge variant="secondary" className="text-xs capitalize">
                  {membership.role}
                </Badge>
                {membership.organizationId === organization.id && (
                  <Check className="text-primary shrink-0" />
                )}
              </Link>
            ))
          )}
        </div>
        <Separator />
        <div className="p-2">
          <Link
            href="/employer/organizations"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors"
          >
            All organizations
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
