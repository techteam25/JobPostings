"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FilterOptionsContent } from "@/app/(main)/components/FilterOptionsContent";
import { useFiltersStore } from "@/context/store";

export function SearchFilterDialogButton() {
  const jobTypes = useFiltersStore((state) => state.jobTypes);
  const remoteOnly = useFiltersStore((state) => state.remoteOnly);
  const datePosted = useFiltersStore((state) => state.datePosted);
  const serviceRoles = useFiltersStore((state) => state.serviceRoles);

  const setJobTypes = useFiltersStore((state) => state.setJobTypes);
  const setRemoteOnly = useFiltersStore((state) => state.setRemoteOnly);
  const setDatePosted = useFiltersStore((state) => state.setDatePosted);
  const setServiceRoles = useFiltersStore((state) => state.setServiceRoles);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="hover:bg-input bg-secondary rounded-full border-none px-3 py-4 shadow-none"
        >
          <SlidersHorizontal className="mr-1" />
        </Button>
      </DialogTrigger>
      <DialogContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 max-h-[85vh] w-4/5 overflow-y-auto rounded-2xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Jobs</DialogTitle>
          <DialogDescription>
            Refine your job search using the filters below
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
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
      </DialogContent>
    </Dialog>
  );
}
