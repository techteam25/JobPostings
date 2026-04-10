"use client";

import { useCallback, useState } from "react";

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
import { useFiltersStore } from "@/context/store";

export const SearchFiltersMobile = () => {
  const [open, setOpen] = useState(false);

  // Filter changes inside the drawer write to Zustand directly via the
  // FilterOptionsContent children — Apply just dismisses the sheet. Clear
  // resets every searchable slice (mirrors `handleClearFilters` in
  // SearchJobsWrapper) and then closes.
  const handleApply = useCallback(() => {
    setOpen(false);
  }, []);

  const handleClearAll = useCallback(() => {
    useFiltersStore.setState({
      jobTypes: [],
      serviceRoles: [],
      remoteOnly: false,
      datePosted: null,
      sortBy: "recent",
    });
    setOpen(false);
  }, []);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
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
          <FilterOptionsContent />
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
