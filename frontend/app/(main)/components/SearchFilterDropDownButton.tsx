"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterOptionsContent } from "@/app/(main)/components/FilterOptionsContent";
import { useFiltersStore } from "@/context/store";

export const SearchFilterDropDownButton = () => {
  const jobTypes = useFiltersStore((state) => state.jobTypes);
  const remoteOnly = useFiltersStore((state) => state.remoteOnly);
  const datePosted = useFiltersStore((state) => state.datePosted);
  const serviceRoles = useFiltersStore((state) => state.serviceRoles);

  const setJobTypes = useFiltersStore((state) => state.setJobTypes);
  const setRemoteOnly = useFiltersStore((state) => state.setRemoteOnly);
  const setDatePosted = useFiltersStore((state) => state.setDatePosted);
  const setServiceRoles = useFiltersStore((state) => state.setServiceRoles);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hover:bg-input bg-secondary data-[state=open]:bg-input rounded-full border-none px-3 py-4 shadow-none focus:bg-transparent focus-visible:ring-0"
        asChild
      >
        <Button
          variant="outline"
          size="icon"
          className="flex size-10 items-center justify-center [&_svg]:size-6"
        >
          <SlidersHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="my-4 w-auto p-4">
        <div className="w-72">
          <FilterOptionsContent
            jobTypes={jobTypes}
            remoteOnly={remoteOnly}
            datePosted={datePosted}
            serviceRoles={serviceRoles}
            onJobTypesChange={setJobTypes}
            onRemoteOnlyChange={setRemoteOnly}
            onDatePostedChange={setDatePosted}
            onServiceRolesChange={setServiceRoles}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
