"use client";

import { useCallback, useRef, useState } from "react";

import { SlidersHorizontal, X } from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { FilterOptionsContent } from "@/app/(main)/components/FilterOptionsContent";
import {
  type DatePosted,
  type JobType,
  type ServiceRole,
  useFiltersStore,
} from "@/context/store";

interface PendingFilters {
  jobTypes: JobType[];
  remoteOnly: boolean;
  datePosted: DatePosted | null;
  serviceRoles: ServiceRole[];
}

const DEFAULT_FILTERS: PendingFilters = {
  jobTypes: [],
  remoteOnly: false,
  datePosted: null,
  serviceRoles: [],
};

export const SearchFiltersMobile = () => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<PendingFilters>(DEFAULT_FILTERS);

  // Track whether the user explicitly applied — when false, closing the
  // drawer discards pending changes instead of committing them.
  const appliedRef = useRef(false);

  // Snapshot Zustand state into local pending state when the drawer opens.
  // Changes accumulate locally until the user taps "Apply Filters".
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      // Opening: snapshot current Zustand state
      const { jobTypes, remoteOnly, datePosted, serviceRoles } =
        useFiltersStore.getState();
      setPending({ jobTypes, remoteOnly, datePosted, serviceRoles });
      appliedRef.current = false;
    } else if (!appliedRef.current) {
      // Closing without applying: reset pending to match Zustand
      const { jobTypes, remoteOnly, datePosted, serviceRoles } =
        useFiltersStore.getState();
      setPending({ jobTypes, remoteOnly, datePosted, serviceRoles });
    }
    setOpen(nextOpen);
  }, []);

  // Commit all pending changes to Zustand in a single batched update, then
  // close the drawer. This produces one API call instead of one per toggle.
  const handleApply = useCallback(() => {
    useFiltersStore.setState(pending);
    appliedRef.current = true;
    setOpen(false);
  }, [pending]);

  // Reset filters to defaults, commit immediately, and close.
  // Preserves keyword/location (mirrors SearchJobsWrapper.handleClearFilters).
  const handleClearAll = useCallback(() => {
    useFiltersStore.setState({
      jobTypes: [],
      serviceRoles: [],
      remoteOnly: false,
      datePosted: null,
      sortBy: "recent",
    });
    appliedRef.current = true;
    setOpen(false);
  }, []);

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger className="w-full lg:hidden" asChild>
        <Button
          aria-label="Open filters"
          className="w-auto justify-end bg-transparent shadow-none hover:bg-transparent"
        >
          <SlidersHorizontal className="text-muted-foreground" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DrawerTitle>Filter Jobs</DrawerTitle>
            <DrawerClose asChild>
              <Button
                aria-label="Close filters"
                variant="ghost"
                size="icon"
                className="text-muted-foreground size-8 rounded-full"
              >
                <X className="size-4" />
              </Button>
            </DrawerClose>
          </div>
          <DrawerDescription className="sr-only">Filter Jobs</DrawerDescription>
        </DrawerHeader>

        <div className="px-4">
          <FilterOptionsContent
            jobTypes={pending.jobTypes}
            remoteOnly={pending.remoteOnly}
            datePosted={pending.datePosted}
            serviceRoles={pending.serviceRoles}
            onJobTypesChange={(types) =>
              setPending((prev) => ({ ...prev, jobTypes: types }))
            }
            onRemoteOnlyChange={(remote) =>
              setPending((prev) => ({ ...prev, remoteOnly: remote }))
            }
            onDatePostedChange={(datePosted) =>
              setPending((prev) => ({ ...prev, datePosted }))
            }
            onServiceRolesChange={(roles) =>
              setPending((prev) => ({ ...prev, serviceRoles: roles }))
            }
          />
        </div>

        <div className="flex flex-col gap-2 px-4 pt-4 pb-6">
          <Button
            onClick={handleApply}
            className="bg-foreground hover:bg-foreground/90 h-12 w-full rounded-full text-base"
          >
            Apply Filters
          </Button>
          <Button
            onClick={handleClearAll}
            variant="ghost"
            className="text-muted-foreground h-10 text-sm"
          >
            Clear All
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
